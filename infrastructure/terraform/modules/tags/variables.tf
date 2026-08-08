variable "environment" {
  description = "Deployment environment name."
  type        = string
}

variable "project" {
  description = "Project name."
  type        = string
}

variable "managed_by" {
  description = "Management tool name."
  type        = string
  default     = "terraform"
}

variable "cost_center" {
  description = "Cost center tag."
  type        = string
}
