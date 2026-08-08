module "tags" {
  source      = "../../modules/tags"
  environment = "production"
  project     = "agbofa-nexus-ai"
  managed_by  = "terraform"
  cost_center = "platform"
}
