import frappe
from frappe.utils import flt
def execute(filters=None):
    filters = filters or {}
    columns = [
        {"fieldname": "name", "label": "Invoice", "fieldtype": "Link", "options": "BA POS Invoice", "width": 160},
        {"fieldname": "posting_date", "label": "Date", "fieldtype": "Date", "width": 100},
        {"fieldname": "customer_name", "label": "Customer", "fieldtype": "Data", "width": 160},
        {"fieldname": "pos_profile", "label": "POS Profile", "fieldtype": "Data", "width": 140},
        {"fieldname": "net_total", "label": "Net Total", "fieldtype": "Currency", "width": 120},
        {"fieldname": "total_taxes", "label": "Tax", "fieldtype": "Currency", "width": 100},
        {"fieldname": "grand_total", "label": "Grand Total", "fieldtype": "Currency", "width": 120},
        {"fieldname": "paid_amount", "label": "Paid", "fieldtype": "Currency", "width": 100},
        {"fieldname": "status", "label": "Status", "fieldtype": "Data", "width": 90},
    ]
    conditions = "WHERE docstatus = 1"
    values = {}
    if filters.get("company"):
        conditions += " AND company = %(company)s"
        values["company"] = filters["company"]
    if filters.get("pos_profile"):
        conditions += " AND pos_profile = %(pos_profile)s"
        values["pos_profile"] = filters["pos_profile"]
    if filters.get("from_date"):
        conditions += " AND posting_date >= %(from_date)s"
        values["from_date"] = filters["from_date"]
    if filters.get("to_date"):
        conditions += " AND posting_date <= %(to_date)s"
        values["to_date"] = filters["to_date"]
    data = frappe.db.sql(f"""
        SELECT name, posting_date, customer_name, pos_profile,
               net_total, total_taxes, grand_total, paid_amount, status
        FROM `tabBA POS Invoice`
        {conditions}
        ORDER BY posting_date DESC
    """, values, as_dict=True)
    return columns, data
