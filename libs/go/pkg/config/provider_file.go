package config

import (
	"context"
	"fmt"
	"os"
	pathpkg "path"
	"path/filepath"
	"strings"
)

// FileProvider reads secrets from a directory tree.
//
// Secret names use '/' as a logical separator, independent of GOOS:
//
//	jwt/keys/k1/public_pem
//
// maps to both the nested path <dir>/jwt/keys/k1/public_pem and the flat
// filename <dir>/jwt--keys--k1--public_pem. Both slash-form and OS-native
// candidates are tried so injected readers and real filesystems work on
// Windows and Unix.
type FileProvider struct {
	dir  string
	read FileReader
}

func NewFileProvider(dir string, read FileReader) *FileProvider {
	if read == nil {
		read = os.ReadFile
	}
	return &FileProvider{dir: dir, read: read}
}

func (p *FileProvider) Name() string { return "file" }

func (p *FileProvider) Get(_ context.Context, name string) (Secret, error) {
	candidates, err := p.fileCandidates(name)
	if err != nil {
		return Secret{}, err
	}
	var last error
	for _, candidate := range candidates {
		raw, err := p.read(candidate)
		if err != nil {
			last = err
			continue
		}
		value := strings.TrimSpace(string(raw))
		if value == "" {
			last = fmt.Errorf("%w: %s", ErrSecretNotFound, name)
			continue
		}
		return NewSecret(name, value), nil
	}
	if last != nil {
		return Secret{}, fmt.Errorf("%w: %s", ErrSecretNotFound, name)
	}
	return Secret{}, fmt.Errorf("%w: %s", ErrSecretNotFound, name)
}

func (p *FileProvider) fileCandidates(name string) ([]string, error) {
	if strings.TrimSpace(p.dir) == "" {
		return nil, fmt.Errorf("%w: secret file directory is not configured", ErrInvalidSecret)
	}
	if !validSecretFileName(name) {
		return nil, fmt.Errorf("%w: illegal secret name", ErrInvalidSecret)
	}

	dirSlash := strings.TrimRight(filepath.ToSlash(p.dir), "/")
	nameSlash := strings.Trim(filepath.ToSlash(name), "/")
	nestedLogical := dirSlash + "/" + nameSlash
	flatLogical := dirSlash + "/" + strings.ReplaceAll(nameSlash, "/", "--")

	raw := []string{
		nestedLogical,
		filepath.FromSlash(nestedLogical),
		filepath.Join(p.dir, filepath.FromSlash(nameSlash)),
		flatLogical,
		filepath.FromSlash(flatLogical),
		filepath.Join(p.dir, strings.ReplaceAll(nameSlash, "/", "--")),
	}

	seen := make(map[string]struct{}, len(raw))
	out := make([]string, 0, len(raw))
	for _, candidate := range raw {
		if candidate == "" {
			continue
		}
		if !secretPathWithinDir(p.dir, candidate) {
			continue
		}
		if _, ok := seen[candidate]; ok {
			continue
		}
		seen[candidate] = struct{}{}
		out = append(out, candidate)
	}
	if len(out) == 0 {
		return nil, fmt.Errorf("%w: illegal secret name", ErrInvalidSecret)
	}
	return out, nil
}

func validSecretFileName(name string) bool {
	trimmed := strings.TrimSpace(name)
	if trimmed == "" {
		return false
	}
	slash := filepath.ToSlash(trimmed)
	if pathpkg.IsAbs(slash) {
		return false
	}
	if strings.Contains(slash, "..") {
		return false
	}
	cleaned := pathpkg.Clean(slash)
	if cleaned == ".." || strings.HasPrefix(cleaned, "../") || pathpkg.IsAbs(cleaned) {
		return false
	}
	return true
}

func secretPathWithinDir(dir, candidate string) bool {
	d := pathpkg.Clean(filepath.ToSlash(dir))
	c := pathpkg.Clean(filepath.ToSlash(candidate))
	if d == "." || d == "" {
		return false
	}
	if !strings.HasPrefix(d, "/") {
		d = pathpkg.Clean("/" + d)
		c = pathpkg.Clean("/" + c)
	}
	return c == d || strings.HasPrefix(c, d+"/")
}
