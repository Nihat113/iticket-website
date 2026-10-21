const contactForm = document.querySelector("#contact-form");

if (contactForm) {
    contactForm.addEventListener("submit", (event) => {
        event.preventDefault();

        if (!contactForm.reportValidity()) return;

        const fields = new FormData(contactForm);
        const subject = `[Ticket.az] ${fields.get("topic")}`;
        const body = [
            `Name: ${fields.get("firstName")} ${fields.get("lastName")}`,
            `Reply email: ${fields.get("email")}`,
            `Topic: ${fields.get("topic")}`,
            "",
            "Message:",
            fields.get("message")
        ].join("\n");

        window.location.href = `mailto:info@iticket.az?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        document.querySelector("#contact-status").textContent = "Your email app should open with your message ready. Review it and press Send to deliver it.";
    });
}
