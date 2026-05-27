frappe.pages["ba-pos"].on_page_load = function(wrapper) {
    frappe.ui.make_app_page({
        parent: wrapper,
        title: "BizAxl POS",
        single_column: true,
    });

    const page = wrapper.page;
    page.main.html(`
        <div id="ba-pos-root" style="height:calc(100vh - 60px);display:flex;flex-direction:column;">
            <!-- Profile selector -->
            <div id="pos-profile-selector" style="padding:20px;max-width:400px;margin:60px auto;background:var(--card-bg);border-radius:12px;box-shadow:var(--shadow-md);">
                <h4 style="margin-bottom:16px;text-align:center;">Select POS Profile</h4>
                <div id="profile-list"></div>
            </div>

            <!-- Main POS terminal (hidden until profile selected) -->
            <div id="pos-terminal" style="display:none;flex:1;overflow:hidden;">
                <!-- Top bar -->
                <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 16px;background:var(--navbar-bg);border-bottom:1px solid var(--border-color);">
                    <div style="display:flex;align-items:center;gap:12px;">
                        <span style="font-weight:600;font-size:16px;">BizAxl POS</span>
                        <span id="pos-profile-name" style="font-size:12px;color:var(--text-muted);background:var(--bg-color);padding:2px 8px;border-radius:4px;"></span>
                    </div>
                    <div style="display:flex;gap:8px;">
                        <button class="btn btn-sm btn-default" onclick="ba_pos.new_order()">New Order</button>
                        <button class="btn btn-sm btn-default" onclick="ba_pos.show_orders()">Orders</button>
                        <button class="btn btn-sm btn-danger" onclick="ba_pos.close_session()">Close</button>
                    </div>
                </div>

                <!-- Main layout -->
                <div style="display:flex;flex:1;overflow:hidden;height:calc(100% - 48px);">
                    <!-- Left: Item browser -->
                    <div style="flex:1.2;display:flex;flex-direction:column;border-right:1px solid var(--border-color);overflow:hidden;">
                        <!-- Search -->
                        <div style="padding:12px;border-bottom:1px solid var(--border-color);">
                            <input id="item-search" type="text" class="form-control" placeholder="Search items by name or code..."
                                style="font-size:15px;" oninput="ba_pos.search_items(this.value)">
                        </div>
                        <!-- Customer -->
                        <div style="padding:8px 12px;border-bottom:1px solid var(--border-color);display:flex;align-items:center;gap:8px;">
                            <span style="font-size:12px;color:var(--text-muted);white-space:nowrap;">Customer:</span>
                            <input id="customer-search" type="text" class="form-control form-control-sm"
                                placeholder="Walk-in customer" oninput="ba_pos.search_customers(this.value)"
                                style="flex:1;">
                            <div id="customer-results" style="display:none;position:absolute;z-index:100;background:var(--card-bg);border:1px solid var(--border-color);border-radius:6px;max-height:200px;overflow-y:auto;width:300px;"></div>
                        </div>
                        <!-- Item grid -->
                        <div id="item-grid" style="flex:1;overflow-y:auto;padding:12px;display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px;align-content:start;">
                        </div>
                    </div>

                    <!-- Right: Cart -->
                    <div style="width:360px;display:flex;flex-direction:column;background:var(--card-bg);">
                        <!-- Cart header -->
                        <div style="padding:12px 16px;border-bottom:1px solid var(--border-color);display:flex;justify-content:space-between;align-items:center;">
                            <span style="font-weight:600;">Current Order</span>
                            <button class="btn btn-xs btn-default" onclick="ba_pos.clear_cart()">Clear</button>
                        </div>

                        <!-- Cart items -->
                        <div id="cart-items" style="flex:1;overflow-y:auto;padding:8px;">
                            <div id="empty-cart" style="text-align:center;color:var(--text-muted);padding:40px 0;font-size:13px;">
                                No items added yet.<br>Search and click items to add.
                            </div>
                        </div>

                        <!-- Totals -->
                        <div style="border-top:1px solid var(--border-color);padding:12px 16px;">
                            <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px;">
                                <span>Net Total</span>
                                <span id="net-total">₹0.00</span>
                            </div>
                            <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px;">
                                <span id="tax-label">Tax (0%)</span>
                                <span id="tax-total">₹0.00</span>
                            </div>
                            <div style="display:flex;justify-content:space-between;font-weight:600;font-size:16px;margin:8px 0;padding-top:8px;border-top:1px solid var(--border-color);">
                                <span>Grand Total</span>
                                <span id="grand-total">₹0.00</span>
                            </div>
                        </div>

                        <!-- Payment -->
                        <div style="padding:12px 16px;border-top:1px solid var(--border-color);">
                            <div style="margin-bottom:8px;">
                                <label style="font-size:12px;color:var(--text-muted);">Payment Mode</label>
                                <select id="payment-mode" class="form-control form-control-sm" style="margin-top:4px;">
                                    <option value="Cash">Cash</option>
                                    <option value="Card">Card</option>
                                    <option value="UPI">UPI</option>
                                </select>
                            </div>
                            <div style="margin-bottom:12px;">
                                <label style="font-size:12px;color:var(--text-muted);">Amount Tendered</label>
                                <input id="tendered-amount" type="number" class="form-control form-control-sm"
                                    placeholder="0.00" style="margin-top:4px;font-size:15px;"
                                    oninput="ba_pos.update_change()">
                            </div>
                            <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:12px;">
                                <span>Change</span>
                                <span id="change-amount" style="color:var(--green);font-weight:600;">₹0.00</span>
                            </div>
                            <button id="charge-btn" class="btn btn-primary btn-lg" style="width:100%;font-size:16px;height:48px;"
                                onclick="ba_pos.charge()">
                                Charge ₹0.00
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Receipt modal -->
            <div id="receipt-modal" style="display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:1000;align-items:center;justify-content:center;">
                <div style="background:var(--card-bg);border-radius:12px;padding:24px;min-width:320px;max-width:400px;text-align:center;">
                    <div style="color:var(--green);font-size:48px;margin-bottom:8px;">✓</div>
                    <h4 id="receipt-invoice-no" style="margin-bottom:4px;"></h4>
                    <p id="receipt-amount" style="font-size:20px;font-weight:600;margin-bottom:4px;"></p>
                    <p id="receipt-change" style="color:var(--text-muted);margin-bottom:20px;"></p>
                    <div style="display:flex;gap:8px;justify-content:center;">
                        <button class="btn btn-default" onclick="ba_pos.print_receipt()">Print</button>
                        <button class="btn btn-primary" onclick="ba_pos.next_order()">Next Order</button>
                    </div>
                </div>
            </div>

            <!-- Customer dropdown -->
            <div id="customer-dropdown" style="display:none;position:fixed;z-index:500;background:var(--card-bg);border:1px solid var(--border-color);border-radius:6px;min-width:280px;max-height:200px;overflow-y:auto;box-shadow:var(--shadow-md);">
            </div>
        </div>
    `);

    // Initialize POS
    ba_pos.init();
};

// ─────────────────────────────────────────────
// POS Controller
// ─────────────────────────────────────────────
window.ba_pos = {
    profile: null,
    cart: [],
    customer: null,
    customer_name: null,
    tax_rate: 0,
    all_items: [],

    init() {
        this.load_profiles();
    },

    load_profiles() {
        frappe.call({
            method: "bizaxl_pos.bizaxl_pos.api.pos.get_pos_profile",
            callback: (r) => {
                const profiles = r.message || [];
                const list = document.getElementById("profile-list");
                if (!profiles.length) {
                    list.innerHTML = `<p style="text-align:center;color:var(--text-muted);">
                        No active POS profiles found.<br>
                        <a href="/app/ba-pos-profile/new-ba-pos-profile-1">Create a POS Profile</a>
                    </p>`;
                    return;
                }
                list.innerHTML = profiles.map(p => `
                    <div onclick="ba_pos.select_profile('${p.name}')"
                        style="padding:12px 16px;border:1px solid var(--border-color);border-radius:8px;
                               margin-bottom:8px;cursor:pointer;transition:all 0.15s;"
                        onmouseover="this.style.background='var(--bg-blue)'"
                        onmouseout="this.style.background=''">
                        <div style="font-weight:600;">${p.profile_name}</div>
                        <div style="font-size:12px;color:var(--text-muted);">${p.company || ""}</div>
                    </div>
                `).join("");
            }
        });
    },

    select_profile(name) {
        frappe.call({
            method: "bizaxl_pos.bizaxl_pos.api.pos.get_pos_profile",
            args: { profile_name: name },
            callback: (r) => {
                this.profile = r.message;
                document.getElementById("pos-profile-selector").style.display = "none";
                document.getElementById("pos-terminal").style.display = "flex";
                document.getElementById("pos-terminal").style.flexDirection = "column";
                document.getElementById("pos-profile-name").textContent = this.profile.profile_name;
                this.load_tax_rate();
                this.load_items();
            }
        });
    },

    load_tax_rate() {
        if (!this.profile.taxes_and_charges) return;
        frappe.call({
            method: "bizaxl_pos.bizaxl_pos.api.pos.get_tax_rate",
            args: { tax_template: this.profile.taxes_and_charges },
            callback: (r) => {
                this.tax_rate = r.message || 0;
                document.getElementById("tax-label").textContent = `Tax (${this.tax_rate}%)`;
            }
        });
    },

    load_items(query="") {
        frappe.call({
            method: "bizaxl_pos.bizaxl_pos.api.pos.search_items",
            args: { query: query || "", warehouse: this.profile.warehouse },
            callback: (r) => {
                this.all_items = r.message || [];
                this.render_item_grid(this.all_items);
            }
        });
    },

    render_item_grid(items) {
        const grid = document.getElementById("item-grid");
        if (!items.length) {
            grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;color:var(--text-muted);padding:40px 0;">No items found</div>`;
            return;
        }
        grid.innerHTML = items.map(item => `
            <div onclick="ba_pos.add_to_cart('${item.name}', '${(item.item_name||"").replace(/'/g,"\\'")}', ${item.standard_rate || 0})"
                style="padding:12px;border:1px solid var(--border-color);border-radius:8px;cursor:pointer;
                       text-align:center;transition:all 0.15s;background:var(--card-bg);"
                onmouseover="this.style.borderColor='var(--primary)';this.style.background='var(--bg-blue)'"
                onmouseout="this.style.borderColor='var(--border-color)';this.style.background='var(--card-bg)'">
                <div style="font-size:24px;margin-bottom:6px;">📦</div>
                <div style="font-size:12px;font-weight:600;margin-bottom:4px;word-break:break-word;">${item.item_name}</div>
                <div style="font-size:13px;color:var(--primary);font-weight:600;">₹${flt(item.standard_rate)}</div>
                ${item.actual_qty !== undefined ? `<div style="font-size:11px;color:var(--text-muted);">Stock: ${item.actual_qty}</div>` : ""}
            </div>
        `).join("");
    },

    search_items(query) {
        clearTimeout(this._search_timer);
        this._search_timer = setTimeout(() => {
            this.load_items(query);
        }, 300);
    },

    search_customers(query) {
        if (!query || query.length < 2) {
            document.getElementById("customer-dropdown").style.display = "none";
            return;
        }
        frappe.call({
            method: "bizaxl_pos.bizaxl_pos.api.pos.search_customers",
            args: { query },
            callback: (r) => {
                const customers = r.message || [];
                const dd = document.getElementById("customer-dropdown");
                if (!customers.length) {
                    dd.style.display = "none";
                    return;
                }
                const input = document.getElementById("customer-search");
                const rect = input.getBoundingClientRect();
                dd.style.top = (rect.bottom + window.scrollY) + "px";
                dd.style.left = rect.left + "px";
                dd.style.display = "block";
                dd.innerHTML = customers.map(c => `
                    <div onclick="ba_pos.select_customer('${c.name}', '${(c.customer_name||"").replace(/'/g,"\\'")}');"
                        style="padding:8px 12px;cursor:pointer;font-size:13px;"
                        onmouseover="this.style.background='var(--bg-blue)'"
                        onmouseout="this.style.background=''">
                        <div style="font-weight:500;">${c.customer_name}</div>
                        <div style="font-size:11px;color:var(--text-muted);">${c.name}</div>
                    </div>
                `).join("");
            }
        });
    },

    select_customer(name, customer_name) {
        this.customer = name;
        this.customer_name = customer_name;
        document.getElementById("customer-search").value = customer_name;
        document.getElementById("customer-dropdown").style.display = "none";
    },

    add_to_cart(item, item_name, rate) {
        const existing = this.cart.find(c => c.item === item);
        if (existing) {
            existing.qty += 1;
            existing.amount = existing.qty * existing.rate;
        } else {
            this.cart.push({
                item,
                item_name,
                rate: flt(rate),
                qty: 1,
                amount: flt(rate),
                warehouse: this.profile.warehouse || "",
                income_account: this.profile.income_account || "",
            });
        }
        this.render_cart();
        this.update_totals();
    },

    remove_from_cart(idx) {
        this.cart.splice(idx, 1);
        this.render_cart();
        this.update_totals();
    },

    update_qty(idx, qty) {
        qty = parseFloat(qty);
        if (isNaN(qty) || qty <= 0) {
            this.remove_from_cart(idx);
            return;
        }
        this.cart[idx].qty = qty;
        this.cart[idx].amount = qty * this.cart[idx].rate;
        this.update_totals();
    },

    render_cart() {
        const container = document.getElementById("cart-items");
        const empty = document.getElementById("empty-cart");
        if (!this.cart.length) {
            container.innerHTML = "";
            container.appendChild(empty);
            empty.style.display = "block";
            return;
        }
        empty.style.display = "none";
        container.innerHTML = this.cart.map((item, idx) => `
            <div style="display:flex;align-items:center;gap:8px;padding:8px;border-bottom:1px solid var(--border-color);font-size:13px;">
                <div style="flex:1;min-width:0;">
                    <div style="font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${item.item_name}</div>
                    <div style="color:var(--text-muted);font-size:12px;">₹${flt(item.rate)} each</div>
                </div>
                <div style="display:flex;align-items:center;gap:4px;">
                    <button class="btn btn-xs btn-default" onclick="ba_pos.update_qty(${idx}, ${item.qty - 1})">−</button>
                    <input type="number" value="${item.qty}" min="0.1" step="0.1"
                        onchange="ba_pos.update_qty(${idx}, this.value)"
                        style="width:44px;text-align:center;border:1px solid var(--border-color);border-radius:4px;padding:2px 4px;font-size:12px;">
                    <button class="btn btn-xs btn-default" onclick="ba_pos.update_qty(${idx}, ${item.qty + 1})">+</button>
                </div>
                <div style="min-width:64px;text-align:right;font-weight:600;">₹${flt(item.amount)}</div>
                <button class="btn btn-xs btn-danger" onclick="ba_pos.remove_from_cart(${idx})" style="padding:2px 6px;">×</button>
            </div>
        `).join("");
    },

    update_totals() {
        const net = this.cart.reduce((s, i) => s + flt(i.amount), 0);
        const tax = flt(net * this.tax_rate / 100, 2);
        const grand = flt(net + tax, 2);

        document.getElementById("net-total").textContent = `₹${net.toFixed(2)}`;
        document.getElementById("tax-total").textContent = `₹${tax.toFixed(2)}`;
        document.getElementById("grand-total").textContent = `₹${grand.toFixed(2)}`;
        document.getElementById("charge-btn").textContent = `Charge ₹${grand.toFixed(2)}`;

        const tendered = parseFloat(document.getElementById("tendered-amount").value) || 0;
        const change = flt(tendered - grand, 2);
        document.getElementById("change-amount").textContent = `₹${Math.max(change, 0).toFixed(2)}`;
    },

    update_change() {
        const net = this.cart.reduce((s, i) => s + flt(i.amount), 0);
        const tax = flt(net * this.tax_rate / 100, 2);
        const grand = flt(net + tax, 2);
        const tendered = parseFloat(document.getElementById("tendered-amount").value) || 0;
        const change = flt(tendered - grand, 2);
        document.getElementById("change-amount").textContent = `₹${Math.max(change, 0).toFixed(2)}`;
    },

    clear_cart() {
        if (!this.cart.length) return;
        frappe.confirm("Clear current order?", () => {
            this.cart = [];
            this.customer = null;
            this.customer_name = null;
            document.getElementById("customer-search").value = "";
            document.getElementById("tendered-amount").value = "";
            this.render_cart();
            this.update_totals();
        });
    },

    charge() {
        if (!this.cart.length) {
            frappe.show_alert({ message: "Add items to cart first", indicator: "orange" }, 3);
            return;
        }
        if (!this.profile) {
            frappe.show_alert({ message: "No POS profile selected", indicator: "red" }, 3);
            return;
        }

        const net = this.cart.reduce((s, i) => s + flt(i.amount), 0);
        const tax = flt(net * this.tax_rate / 100, 2);
        const grand = flt(net + tax, 2);
        const tendered = parseFloat(document.getElementById("tendered-amount").value) || grand;
        const mode = document.getElementById("payment-mode").value;

        if (tendered < grand) {
            frappe.show_alert({ message: "Tendered amount is less than grand total", indicator: "orange" }, 3);
            return;
        }

        document.getElementById("charge-btn").disabled = true;
        document.getElementById("charge-btn").textContent = "Processing...";

        const data = {
            customer: this.customer || "",
            pos_profile: this.profile.name,
            company: this.profile.company,
            taxes_and_charges: this.profile.taxes_and_charges || "",
            items: this.cart,
            payments: [{
                mode_of_payment: mode,
                amount: tendered,
                account: this.profile.cash_account || "",
            }],
        };

        frappe.call({
            method: "bizaxl_pos.bizaxl_pos.api.pos.create_pos_invoice",
            args: { data: JSON.stringify(data) },
            callback: (r) => {
                document.getElementById("charge-btn").disabled = false;
                this.update_totals();
                if (r.exc || !r.message) {
                    frappe.show_alert({ message: "Error creating invoice", indicator: "red" }, 4);
                    return;
                }
                const inv = r.message;
                this._last_invoice = inv;
                this.show_receipt(inv, grand, Math.max(tendered - grand, 0));
            },
            error: () => {
                document.getElementById("charge-btn").disabled = false;
                this.update_totals();
            }
        });
    },

    show_receipt(inv, grand, change) {
        document.getElementById("receipt-invoice-no").textContent = inv.name;
        document.getElementById("receipt-amount").textContent = `₹${flt(grand).toFixed(2)}`;
        document.getElementById("receipt-change").textContent = change > 0 ? `Change: ₹${flt(change).toFixed(2)}` : "Exact payment";
        const modal = document.getElementById("receipt-modal");
        modal.style.display = "flex";
    },

    next_order() {
        document.getElementById("receipt-modal").style.display = "none";
        this.cart = [];
        this.customer = null;
        this.customer_name = null;
        document.getElementById("customer-search").value = "";
        document.getElementById("tendered-amount").value = "";
        this.render_cart();
        this.update_totals();
    },

    print_receipt() {
        if (!this._last_invoice) return;
        const w = window.open("", "_blank", "width=400,height=600");
        const inv = this._last_invoice;
        w.document.write(`
            <html><head><title>Receipt</title>
            <style>body{font-family:monospace;font-size:13px;padding:20px;max-width:300px;margin:0 auto;}
            h3{text-align:center;}hr{border:none;border-top:1px dashed #000;}
            .row{display:flex;justify-content:space-between;margin:4px 0;}
            .total{font-size:16px;font-weight:bold;}</style>
            </head><body>
            <h3>BizAxl POS</h3>
            <hr>
            <div class="row"><span>Invoice:</span><span>${inv.name}</span></div>
            <div class="row"><span>Total:</span><span class="total">₹${flt(inv.grand_total).toFixed(2)}</span></div>
            <div class="row"><span>Change:</span><span>₹${flt(inv.change_amount).toFixed(2)}</span></div>
            <hr>
            <p style="text-align:center;">Thank you!</p>
            </body></html>
        `);
        w.print();
        w.close();
    },

    new_order() {
        if (this.cart.length) {
            frappe.confirm("Start a new order? Current order will be cleared.", () => {
                this.next_order();
            });
        }
    },

    show_orders() {
        frappe.set_route("List", "BA POS Invoice");
    },

    close_session() {
        frappe.confirm("Close POS session?", () => {
            this.profile = null;
            this.cart = [];
            document.getElementById("pos-terminal").style.display = "none";
            document.getElementById("pos-profile-selector").style.display = "block";
            this.load_profiles();
        });
    },
};

function flt(val, precision=2) {
    return Math.round(parseFloat(val || 0) * Math.pow(10, precision)) / Math.pow(10, precision);
}
