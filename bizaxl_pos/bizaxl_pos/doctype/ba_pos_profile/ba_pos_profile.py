import frappe
from frappe.model.document import Document

class BAPOSProfile(Document):
    def validate(self):
        if not self.warehouse:
            frappe.throw("Default Warehouse is required for POS Profile.")
