module "tags" {
  source      = "../../modules/tags"
  environment = "development"
  project     = "agbofa-nexus-ai"
  managed_by  = "terraform"
  cost_center = "platform"
}
