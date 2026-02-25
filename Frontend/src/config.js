// src/config.js

/**
 * Configuration globale de l'application.
 * Permet de changer l'URL du backend en un seul endroit.
 */
export const API_BASE_URL = "http://localhost:8080/api";

/**
 * Routes des endpoints API.
 * Utiliser ces constantes évite les fautes de frappe dans les URLs.
 */
export const ENDPOINTS = {
    PRODUCTS: `${API_BASE_URL}/products`,
    ORDERS: `${API_BASE_URL}/orders`,
    SALESPERSONS: `${API_BASE_URL}/salespersons`,
    INGREDIENTS: `${API_BASE_URL}/ingredients`,
    CUSTOMERS: `${API_BASE_URL}/customers`
};