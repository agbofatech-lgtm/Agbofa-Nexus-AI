locals {
  tags = {
    Environment = var.environment
    Project     = var.project
    ManagedBy   = var.managed_by
    CostCenter  = var.cost_center
  }
}
