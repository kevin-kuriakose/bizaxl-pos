import frappe
from frappe.model.document import Document
from frappe.utils import flt


class BAPOSClosingEntry(Document):
    def validate(self):
        self.calculate_summary()
        self.cash_variance = flt(self.closing_cash) - flt(self.opening_cash)
        self.set_status()

    def calculate_summary(self):
        result = frappe.db.sql("""
            SELECT COUNT(*) as cnt,
                   COALESCE(SUM(net_total), 0) as net,
                   COALESCE(SUM(grand_total), 0) as grand
            FROM `tabBA POS Invoice`
            WHERE pos_profile = %s
            AND posting_date >= DATE(%s)
            AND docstatus = 1
        """, (self.pos_profile, self.period_start_date), as_dict=True)
        if result:
            self.total_invoices = result[0].cnt or 0
            self.net_total = flt(result[0].net)
            self.grand_total = flt(result[0].grand)

    def set_status(self):
        if self.docstatus == 0:
            self.status = "Draft"
        elif self.docstatus == 1:
            self.status = "Submitted"
        elif self.docstatus == 2:
            self.status = "Cancelled"
