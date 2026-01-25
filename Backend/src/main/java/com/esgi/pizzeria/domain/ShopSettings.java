package com.esgi.pizzeria.domain;

/**
 * Configuration globale du magasin (imprimée sur les tickets).
 */
public class ShopSettings {
    private String shopName;
    private String address;
    private String phone;
    private String siret;
    private String ticketFooter; // Message de bas de ticket

    public ShopSettings() {}

    // --- GETTERS & SETTERS ---
    public String getShopName() { return shopName; }
    public void setShopName(String shopName) { this.shopName = shopName; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getSiret() { return siret; }
    public void setSiret(String siret) { this.siret = siret; }
    public String getTicketFooter() { return ticketFooter; }
    public void setTicketFooter(String ticketFooter) { this.ticketFooter = ticketFooter; }
}