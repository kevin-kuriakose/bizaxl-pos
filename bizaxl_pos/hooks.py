app_name = "bizaxl_pos"
app_title = "BizAxl POS"
app_publisher = "BizAxl"
app_description = "Point of Sale for BizAxl"
app_email = "dev@bizaxl.com"
app_license = "MIT"
app_version = "1.0.0"
required_apps = ["frappe", "bizaxl_erp", "bizaxl_stock"]

doc_events = {
    "BA POS Invoice": {
        "on_submit": "bizaxl_pos.bizaxl_pos.doctype.ba_pos_invoice.ba_pos_invoice.on_submit_hook",
        "on_cancel": "bizaxl_pos.bizaxl_pos.doctype.ba_pos_invoice.ba_pos_invoice.on_cancel_hook",
    }
}
