"use client";

import { FileAudio, FileImage, FileVideo, UploadCloud, X } from "lucide-react";
import { useEffect, useRef, useState, type DragEvent } from "react";

import { WatermarkedImage } from "@/components/shared/media/WatermarkedImage";
import { WatermarkedVideo } from "@/components/shared/media/WatermarkedVideo";
import { Button } from "@/components/ui";
import type { MediaUploadState } from "@/types/multimodal";

interface MediaUploaderProps {
  upload: MediaUploadState;
  onProcess: (file: File) => void;
}

const kindIcons = {
  image: FileImage,
  video: FileVideo,
  audio: FileAudio,
} as const;

export function MediaUploader({ upload, onProcess }: MediaUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );

  const choose = (next: File | undefined) => {
    if (!next) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(next);
    setPreviewUrl(URL.createObjectURL(next));
    onProcess(next);
  };
  const drop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    choose(event.dataTransfer.files[0]);
  };
  const Icon = upload.mediaKind ? kindIcons[upload.mediaKind] : UploadCloud;

  return (
    <section
      className="media-uploader glass"
      aria-labelledby="media-uploader-title"
    >
      <div className="intelligence-panel-heading">
        <div>
          <span className="section-kicker">Frontend-only upload</span>
          <h2 id="media-uploader-title">Media uploader</h2>
        </div>
        <span>25 MB demo limit</span>
      </div>
      <div
        className={
          dragging
            ? "media-dropzone media-dropzone--dragging"
            : "media-dropzone"
        }
        onDragEnter={() => setDragging(true)}
        onDragLeave={() => setDragging(false)}
        onDragOver={(event) => event.preventDefault()}
        onDrop={drop}
      >
        <Icon size={31} />
        <strong>Drop image, video, or audio</strong>
        <p>
          JPG, PNG, WebP, MP4, WebM, MP3, WAV, or OGG. Nothing is sent to a
          server.
        </p>
        <Button onClick={() => inputRef.current?.click()} size="sm">
          Choose media
        </Button>
        <input
          ref={inputRef}
          accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,audio/mpeg,audio/wav,audio/ogg"
          className="sr-only"
          onChange={(event) => choose(event.target.files?.[0])}
          type="file"
        />
      </div>
      {file && previewUrl ? (
        <div className="media-local-preview">
          <div>
            <strong>{file.name}</strong>
            <span>{(file.size / 1_048_576).toFixed(2)} MB · local preview</span>
          </div>
          {upload.mediaKind === "image" ? (
            <WatermarkedImage
              alt={`Local preview of ${file.name}`}
              height={450}
              src={previewUrl}
              width={800}
            />
          ) : upload.mediaKind === "video" ? (
            <WatermarkedVideo
              src={previewUrl}
              title={`Local preview of ${file.name}`}
            />
          ) : upload.mediaKind === "audio" ? (
            <audio
              aria-label={`Local preview of ${file.name}`}
              controls
              src={previewUrl}
            />
          ) : null}
          <button
            aria-label="Clear local media preview"
            onClick={() => {
              if (previewUrl) URL.revokeObjectURL(previewUrl);
              setPreviewUrl(null);
              setFile(null);
            }}
            type="button"
          >
            <X size={15} />
          </button>
        </div>
      ) : null}
      {upload.status !== "idle" ? (
        <div
          className={`media-processing media-processing--${upload.status}`}
          aria-live="polite"
        >
          <span>
            <strong>
              {upload.status === "success"
                ? "Demo processing complete"
                : upload.status === "error"
                  ? "Demo processing failed"
                  : "Demo processing"}
            </strong>
            <small>
              {upload.error ??
                `${upload.progress}% · Backend integration pending`}
            </small>
          </span>
          <i>
            <b style={{ width: `${upload.progress}%` }} />
          </i>
        </div>
      ) : null}
    </section>
  );
}
