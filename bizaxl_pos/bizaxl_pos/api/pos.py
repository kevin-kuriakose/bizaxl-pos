import frappe
from frappe.utils import flt, nowdate, nowtime


@frappe.whitelist()
def get_pos_profile(profile_name=None):
    if profile_name:
        return frappe.get_doc("BA POS Profile", profile_name).as_dict()
    profiles = frappe.get_all(
        "BA POS Profile",
        filters={"is_active": 1},
        fields=["name", "profile_name", "company", "warehouse",
                "income_account", "cash_account", "taxes_and_charges"],
        limit=20
    )
    return profiles


@frappe.whitelist()
def search_items(query, warehouse=None):
    filters = [
        ["BA Item", "item_name", "like", f"%{query}%"],
        ["BA Item", "disabled", "=", 0],
    ]
    items = frappe.get_all(
        "BA Item",
        filters=filters,
        fields=["name", "item_name", "item_group", "standard_rate"],
        limit=20
    )
    if warehouse:
        for item in items:
            qty = frappe.db.sql("""
                SELECT COALESCE(SUM(actual_qty), 0) as qty
                FROM `tabBA Stock Ledger Entry`
                WHERE item = %s AND warehouse = %s AND is_cancelled = 0
            """, (item.name, warehouse), as_dict=True)
            item["actual_qty"] = flt(qty[0].qty) if qty else 0
    return items


@frappe.whitelist()
def get_item_price(item, price_list="Standard Selling"):
    price = frappe.db.get_value(
        "BA Item Price",
        {"item": item},
        "price_list_rate"
    )
    if not price:
        price = frappe.db.get_value("BA Item", item, "standard_rate")
    return flt(price)


@frappe.whitelist()
def search_customers(query):
    return frappe.get_all(
        "BA Customer",
        filters=[["BA Customer", "customer_name", "like", f"%{query}%"]],
        fields=["name", "customer_name"],
        limit=20
    )


@frappe.whitelist()
def create_pos_invoice(data):
    import json
    if isinstance(data, str):
        data = json.loads(data)

    doc = frappe.get_doc({
        "doctype": "BA POS Invoice",
        "customer": data.get("customer"),
        "pos_profile": data.get("pos_profile"),
        "company": data.get("company"),
        "posting_date": nowdate(),
        "posting_time": nowtime(),
        "taxes_and_charges": data.get("taxes_and_charges"),
        "cashier_shift": data.get("cashier_shift"),
        "remarks": data.get("remarks"),
    })

    for item in data.get("items", []):
        doc.append("items", {
            "item": item["item"],
            "item_name": item.get("item_name", ""),
            "qty": flt(item["qty"]),
            "rate": flt(item["rate"]),
            "warehouse": item.get("warehouse", ""),
            "income_account": item.get("income_account", ""),
        })

    for payment in data.get("payments", []):
        doc.append("payments", {
            "mode_of_payment": payment["mode_of_payment"],
            "amount": flt(payment["amount"]),
            "account": payment.get("account", ""),
        })

    doc.flags.ignore_permissions = True
    doc.insert()
    doc.submit()
    frappe.db.commit()

    return {
        "name": doc.name,
        "grand_total": doc.grand_total,
        "net_total": doc.net_total,
        "change_amount": doc.change_amount,
        "status": doc.status,
    }


@frappe.whitelist()
def get_open_cashier_shift(pos_profile):
    shift = frappe.db.get_value(
        "Cashier Shift",
        {"status": "Open", "pos_profile": pos_profile, "docstatus": 1},
        ["name", "opening_cash"],
        as_dict=True
    )
    return shift


@frappe.whitelist()
def get_tax_rate(tax_template):
    if not tax_template:
        return 0
    try:
        template = frappe.get_doc("BA Tax Template", tax_template)
        total_rate = sum(flt(t.rate) for t in template.taxes if t.tax_type == "On Net Total")
        return total_rate
    except Exception:
        return 0
