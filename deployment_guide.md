# VPS Deployment Guide: Securing a Server & Pointing Your Domain

Hosting your app on a Virtual Private Server (VPS) gives you full control and is often cheaper than managed services. Here is a step-by-step guide to get your server running and your domain connected.

---

## 1. Secure a VPS (Virtual Private Server)

You need to rent a virtual computer that runs 24/7. 

**Recommended Providers:**
*   **DigitalOcean:** Very user-friendly, great documentation. (Recommended)
*   **Hetzner:** Extremely cheap and powerful, popular in Europe.
*   **Linode (Akamai) / Vultr:** Solid alternatives.

**Steps to Rent a VPS (Example using DigitalOcean):**

1.  **Create an Account:** Sign up at [DigitalOcean.com](https://www.digitalocean.com/).
2.  **Create a Droplet:** In their dashboard, click "Create" and select "Droplet" (their term for a VPS).
3.  **Choose an Image:** Select **Ubuntu 24.04 LTS** (or 22.04 LTS). This is the most common Linux OS for servers and easiest to get help with.
4.  **Choose a Size (Specs):**
    *   *Minimum for this stack:* You are running a React Frontend, a Python API, and n8n. Because n8n can be a bit heavy, I recommend a plan with at least **2GB RAM** (around $10-$12/month). 
    *   *Ollama Warning:* If you actually want to run Ollama and the `hermes3` model on the server instead of just calling the Gemini API, you need a *massive* server (16GB+ RAM) which gets expensive. I recommend skipping local models for your public hosted version.
5.  **Choose a Datacenter Region:** Pick the location closest to where your users will be (e.g., New York, Frankfurt).
6.  **Authentication:** Choose **Password** and create a strong password, or (better) set up **SSH Keys** if you know how to use them.
7.  **Click Create:** Wait a minute for it to spin up.

**Your Golden Ticket:**
Once the Droplet is created, DigitalOcean will give you a **public IP address** (e.g., `167.71.12.34`). Save this number. This is the address of your new server on the internet.

---

## 2. Buy a Domain Name

If you don't already have one, you need a human-readable name (like `my-ai-tool.com`).

**Recommended Registrars:**
*   **Porkbun:** Cheap, transparent pricing, free privacy.
*   **Cloudflare:** Sells domains at wholesale cost.
*   *(Avoid GoDaddy if possible, they have many hidden renewal fees.)*

---

## 3. Point the Domain to Your VPS IP Address

Now you need to tell the internet that when someone types your domain name, it should send the request to your new VPS. You do this by configuring **DNS Records** at the place where you bought your domain (your registrar).

**Steps:**

1.  Log into your Domain Registrar (e.g., Porkbun, Namecheap, Cloudflare).
2.  Find the **DNS Management** or **DNS Records** section for your domain.
3.  **Create an 'A Record' for your main site:**
    *   **Type:** A
    *   **Name/Host:** `@` (This means the root domain, e.g., `yourdomain.com`)
    *   **Value/Answer/IP:** Paste the `IP Address` of your VPS here.
    *   **TTL:** Automatic or 3600 (1 hour).
4.  *(Optional but Recommended) Create an 'A Record' for the API:*
    *   If you want your backend on a subdomain, create another record.
    *   **Type:** A
    *   **Name/Host:** `api` (This creates `api.yourdomain.com`)
    *   **Value:** Paste the *same* `IP Address`.
5.  *(Optional but Recommended) Create an 'A Record' for n8n:*
    *   **Type:** A
    *   **Name/Host:** `n8n` (This creates `n8n.yourdomain.com`)
    *   **Value:** Paste the *same* `IP Address`.

**Wait for Propagation:**
DNS changes can take anywhere from 5 minutes to 24 hours to update across all the routers in the world (though it's usually very fast). You can check if it's working by going to [whatsmydns.net](https://www.whatsmydns.net/) and typing in your domain.

---

## 4. Next Steps

Once you have your VPS IP address and your domain name is pointed at it, you are ready for the fun part: deploying the code!

Just let me know your Server IP and the Domain Name, and I'll walk you through SSH'ing into the server and installing Docker to run the AI Swarm.
