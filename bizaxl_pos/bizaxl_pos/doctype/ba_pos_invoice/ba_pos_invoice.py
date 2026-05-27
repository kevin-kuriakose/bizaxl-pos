import frappe
from frappe.model.document import Document
from frappe.utils import flt, nowtime


class BAPOSInvoice(Document):
    def validate(self):
        self.set_posting_time()
        self.set_profile_defaults()
        self.calculate_totals()
        self.calculate_taxes()
        self.calculate_change()
        self.set_status()

    def set_posting_time(self):
        if not self.posting_time:
            self.posting_time = nowtime()

    def set_profile_defaults(self):
        if not self.pos_profile:
            return
        profile = frappe.get_doc("BA POS Profile", self.pos_profile)
        for item in self.items:
            if not item.warehouse:
                item.warehouse = profile.warehouse
            if not item.income_account:
                item.income_account = profile.income_account
        if not self.debit_to:
            self.debit_to = profile.cash_account
        if not self.taxes_and_charges and profile.taxes_and_charges:
            self.taxes_and_charges = profile.taxes_and_charges

    def calculate_totals(self):
        net_total = 0
        for item in self.items:
            item.amount = flt(item.qty) * flt(item.rate)
            net_total += item.amount
        self.net_total = net_total

    def calculate_taxes(self):
        if not self.taxes_and_charges:
            self.total_taxes = 0
            self.grand_total = self.net_total
            return
        try:
            template = frappe.get_doc("BA Tax Template", self.taxes_and_charges)
            total_taxes = 0
            for tax in template.taxes:
                if tax.tax_type == "On Net Total":
                    total_taxes += flt(self.net_total) * flt(tax.rate) / 100
            self.total_taxes = total_taxes
        except Exception:
            self.total_taxes = 0
        self.grand_total = self.net_total + self.total_taxes
        self.outstanding_amount = self.grand_total

    def calculate_change(self):
        total_paid = sum(flt(p.amount) for p in (self.payments or []))
        if total_paid:
            self.paid_amount = total_paid
            self.change_amount = max(total_paid - self.grand_total, 0)
            self.outstanding_amount = max(self.grand_total - total_paid, 0)

    def set_status(self):
        if self.docstatus == 0:
            self.status = "Draft"
        elif self.docstatus == 2:
            self.status = "Cancelled"
        elif flt(self.outstanding_amount) <= 0:
            self.status = "Paid"
        else:
            self.status = "Unpaid"

    def on_submit(self):
        self.set_status()
        self.make_gl_entries()
        self.update_stock()

    def on_cancel(self):
        self.status = "Cancelled"
        self.cancel_gl_entries()
        self.cancel_stock_entries()

    def make_gl_entries(self):
        from bizaxl_erp.bizaxl_accounts.gl_handler import make_gl_entry
        company = frappe.get_doc("BA Company", self.company)

        debit_account = self.debit_to or company.default_receivable_account
        if not debit_account:
            frappe.throw("Set a Debit To account or Default Receivable Account on the company.")

        make_gl_entry(
            company=self.company,
            posting_date=self.posting_date,
            account=debit_account,
            debit=self.grand_total,
            credit=0,
            voucher_type="BA POS Invoice",
            voucher_no=self.name,
            remarks=f"POS Sale - {self.customer_name or 'Walk-in'}",
        )

        for item in self.items:
            income_account = item.income_account or company.default_income_account
            if income_account:
                make_gl_entry(
                    company=self.company,
                    posting_date=self.posting_date,
                    account=income_account,
                    debit=0,
                    credit=item.amount,
                    voucher_type="BA POS Invoice",
                    voucher_no=self.name,
                    remarks=f"POS Sale: {item.item_name}",
                )

    def cancel_gl_entries(self):
        frappe.db.sql("""
            UPDATE `tabBA GL Entry`
            SET is_cancelled = 1
            WHERE voucher_type = 'BA POS Invoice'
            AND voucher_no = %s
        """, self.name)

    def update_stock(self):
        from bizaxl_erp.bizaxl_accounts.gl_handler import make_gl_entry
        for item in self.items:
            if not item.warehouse:
                continue
            frappe.get_doc({
                "doctype": "BA Stock Ledger Entry",
                "item": item.item,
                "warehouse": item.warehouse,
                "actual_qty": -flt(item.qty),
                "qty_after_transaction": 0,
                "voucher_type": "BA POS Invoice",
                "voucher_no": self.name,
                "posting_date": self.posting_date,
                "company": self.company,
            }).insert(ignore_permissions=True)

    def cancel_stock_entries(self):
        frappe.db.sql("""
            UPDATE `tabBA Stock Ledger Entry`
            SET is_cancelled = 1
            WHERE voucher_type = 'BA POS Invoice'
            AND voucher_no = %s
        """, self.name)


def on_submit_hook(doc, method):
    pass


def on_cancel_hook(doc, method):
    pass
