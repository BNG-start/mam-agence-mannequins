/* ============================================
   MAM — comportements de la page
   En-tête, menu, compteurs, filtres,
   lightbox, formulaire WhatsApp, année
   ============================================ */
(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var lightbox = document.getElementById("lightbox");

  initHeader();
  initMenu();
  initReveal();
  initCompteurs();
  initFiltres();
  initLightbox();
  initFormulaire();
  initImages();
  initAnnee();

  function initHeader() {
    var header = document.querySelector(".site-header");
    if (!header) return;

    function onScroll() {
      header.classList.toggle("is-scrolled", window.scrollY > 24);
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  function initMenu() {
    var header = document.querySelector(".site-header");
    var panel = document.getElementById("nav-panel");
    var toggle = document.querySelector(".nav-toggle");
    if (!header || !panel || !toggle) return;

    function mobile() {
      return window.innerWidth < 1024;
    }

    function locked() {
      return panel.classList.contains("is-open") || (lightbox && lightbox.classList.contains("is-open"));
    }

    function setOpen(open) {
      panel.classList.toggle("is-open", open);
      header.classList.toggle("is-menu", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
      document.body.classList.toggle("is-locked", locked());

      if (mobile()) {
        panel.setAttribute("aria-hidden", open ? "false" : "true");
        if (open) panel.removeAttribute("inert");
        else panel.setAttribute("inert", "");
      } else {
        panel.removeAttribute("aria-hidden");
        panel.removeAttribute("inert");
      }

      if (open) {
        var first = panel.querySelector("a");
        if (first) first.focus();
      }
    }

    if (mobile()) {
      panel.setAttribute("aria-hidden", "true");
      panel.setAttribute("inert", "");
    }

    toggle.addEventListener("click", function () {
      var willOpen = toggle.getAttribute("aria-expanded") !== "true";
      setOpen(willOpen);
      if (!willOpen) toggle.focus();
    });

    header.addEventListener("click", function (event) {
      var link = event.target.closest("a[href^='#']");
      if (!link) return;
      setOpen(false);
      var target = document.getElementById(link.getAttribute("href").slice(1));
      if (!target) return;
      target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && panel.classList.contains("is-open")) {
        if (lightbox && lightbox.classList.contains("is-open")) return;
        setOpen(false);
        toggle.focus();
      }
      if (event.key === "Tab" && panel.classList.contains("is-open")) {
        trapFocus(header, event);
      }
    });

    window.addEventListener("resize", function () {
      if (!mobile()) {
        if (panel.classList.contains("is-open")) setOpen(false);
        panel.removeAttribute("aria-hidden");
        panel.removeAttribute("inert");
        return;
      }
      if (!panel.classList.contains("is-open")) {
        panel.setAttribute("aria-hidden", "true");
        panel.setAttribute("inert", "");
      }
    });
  }

  function initReveal() {
    var items = document.querySelectorAll(".reveal");
    if (!items.length) return;

    items.forEach(function (el) {
      var siblings = el.parentElement
        ? Array.prototype.filter.call(el.parentElement.children, function (child) {
            return child.classList && child.classList.contains("reveal");
          })
        : [];
      var index = siblings.indexOf(el);
      if (!reduce && index > 0) el.style.transitionDelay = Math.min(index, 6) * 70 + "ms";
    });

    if (reduce || !("IntersectionObserver" in window)) {
      items.forEach(function (el) {
        el.classList.add("is-visible");
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.16, rootMargin: "0px 0px -8% 0px" }
    );

    items.forEach(function (el) {
      observer.observe(el);
    });
  }

  function initCompteurs() {
    var nums = document.querySelectorAll(".stat-num");
    if (!nums.length) return;

    function finalText(el) {
      var decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
      var value = parseFloat(el.getAttribute("data-value"));
      return format(value, decimals) + (el.getAttribute("data-suffix") || "");
    }

    if (reduce || !("IntersectionObserver" in window)) {
      nums.forEach(function (el) {
        el.textContent = finalText(el);
      });
      return;
    }

    nums.forEach(function (el) {
      el.textContent = "0" + (el.getAttribute("data-suffix") || "");
    });

    var section = document.querySelector(".stats");
    if (!section) return;

    var observer = new IntersectionObserver(
      function (entries) {
        if (!entries.some(function (entry) { return entry.isIntersecting; })) return;
        nums.forEach(animate);
        observer.disconnect();
      },
      { threshold: 0.35 }
    );
    observer.observe(section);

    function animate(el) {
      var target = parseFloat(el.getAttribute("data-value"));
      var decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
      var suffix = el.getAttribute("data-suffix") || "";
      var duration = 1400;
      var start = performance.now();

      function frame(now) {
        var progress = Math.min(1, (now - start) / duration);
        var eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = format(target * eased, decimals) + suffix;
        if (progress < 1) requestAnimationFrame(frame);
      }

      requestAnimationFrame(frame);
    }
  }

  function format(value, decimals) {
    return value.toFixed(decimals).replace(".", ",");
  }

  function initFiltres() {
    var buttons = document.querySelectorAll(".filter-btn");
    var cards = document.querySelectorAll(".model-card");
    var status = document.getElementById("filtre-status");
    if (!buttons.length) return;

    buttons.forEach(function (button) {
      button.addEventListener("click", function () {
        var filter = button.getAttribute("data-filter");
        buttons.forEach(function (item) {
          var on = item === button;
          item.setAttribute("aria-pressed", on ? "true" : "false");
        });

        var count = 0;
        cards.forEach(function (card) {
          var show = filter === "tous" || card.getAttribute("data-category") === filter;
          card.hidden = !show;
          if (show) count += 1;
        });

        if (status) {
          status.textContent = count + (count > 1 ? " profils affichés" : " profil affiché");
        }
      });
    });
  }

  function initLightbox() {
    if (!lightbox) return;

    var figureImg = document.getElementById("lightbox-img");
    var nameEl = document.getElementById("lightbox-name");
    var countEl = document.getElementById("lightbox-count");
    var closeBtn = lightbox.querySelector(".lightbox-close");
    var prevBtn = lightbox.querySelector(".lightbox-prev");
    var nextBtn = lightbox.querySelector(".lightbox-next");
    var index = 0;
    var lastFocus = null;
    var touchX = null;

    function cards() {
      return Array.prototype.filter.call(document.querySelectorAll(".model-card"), function (card) {
        return !card.hidden;
      });
    }

    function show(nextIndex) {
      var list = cards();
      if (!list.length) return;
      index = (nextIndex + list.length) % list.length;
      var card = list[index];
      var source = card.querySelector("img");
      figureImg.src = source.getAttribute("data-full") || source.src;
      figureImg.alt = source.alt;
      nameEl.textContent = card.getAttribute("data-name") || "";
      countEl.textContent = index + 1 + " / " + list.length;
    }

    function open(card) {
      lastFocus = document.activeElement;
      lightbox.classList.add("is-open");
      lightbox.setAttribute("aria-hidden", "false");
      lightbox.removeAttribute("inert");
      document.body.classList.add("is-locked");
      show(cards().indexOf(card));
      closeBtn.focus();
    }

    function close() {
      lightbox.classList.remove("is-open");
      lightbox.setAttribute("aria-hidden", "true");
      lightbox.setAttribute("inert", "");
      document.body.classList.toggle("is-locked", document.getElementById("nav-panel").classList.contains("is-open"));
      figureImg.removeAttribute("src");
      if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
    }

    document.querySelectorAll(".model-card").forEach(function (card) {
      card.addEventListener("click", function () {
        open(card);
      });
    });

    closeBtn.addEventListener("click", close);
    prevBtn.addEventListener("click", function () { show(index - 1); });
    nextBtn.addEventListener("click", function () { show(index + 1); });

    lightbox.addEventListener("click", function (event) {
      if (event.target === lightbox) close();
    });

    lightbox.addEventListener("touchstart", function (event) {
      touchX = event.changedTouches[0].clientX;
    }, { passive: true });

    lightbox.addEventListener("touchend", function (event) {
      if (touchX === null) return;
      var delta = event.changedTouches[0].clientX - touchX;
      touchX = null;
      if (Math.abs(delta) < 45) return;
      show(delta < 0 ? index + 1 : index - 1);
    }, { passive: true });

    document.addEventListener("keydown", function (event) {
      if (!lightbox.classList.contains("is-open")) return;
      if (event.key === "Escape") {
        close();
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        show(index + 1);
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        show(index - 1);
      }
      if (event.key === "Tab") trapFocus(lightbox, event);
    });
  }

  function initFormulaire() {
    var form = document.getElementById("cast-form");
    if (!form) return;

    var phone = form.elements.telephone;
    var status = document.getElementById("form-status");
    var whatsapp = "22376291695";

    function clearCustom(event) {
      if (event.target && typeof event.target.setCustomValidity === "function") {
        event.target.setCustomValidity("");
      }
    }

    form.addEventListener("input", clearCustom);

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      form.classList.add("is-submitted");

      ["nom", "prenom", "ville"].forEach(function (name) {
        var field = form.elements[name];
        field.setCustomValidity(field.value.trim() ? "" : "Ce champ est obligatoire.");
      });

      var digits = phone.value.replace(/\D/g, "");
      phone.setCustomValidity(digits.length >= 8 ? "" : "Indiquez un numéro de téléphone valide.");

      if (!form.checkValidity()) {
        var invalid = form.querySelector(":invalid");
        if (invalid) invalid.focus();
        form.reportValidity();
        return;
      }

      var photoNames = [form.elements.photo1, form.elements.photo2]
        .map(function (input) {
          return input.files && input.files[0] ? input.files[0].name : "";
        })
        .filter(Boolean);

      var social = form.elements.social.value.trim();
      var message = form.elements.message.value.trim();
      var lines = [
        "Bonjour MAM — Modèles Agence et Management,",
        "Je souhaite proposer ma candidature.",
        "",
        "Nom : " + form.elements.nom.value.trim(),
        "Prénom : " + form.elements.prenom.value.trim(),
        "Âge : " + form.elements.age.value.trim(),
        "Sexe : " + form.elements.sexe.value,
        "Taille : " + form.elements.taille.value.trim() + " cm",
        "Ville : " + form.elements.ville.value.trim(),
        "Téléphone / WhatsApp : " + phone.value.trim(),
        "Instagram / TikTok : " + (social || "Non renseigné"),
        "Message : " + (message || "—"),
        "",
        "Photos à joindre dans cette conversation : " + (photoNames.join(", ") || "à ajouter")
      ];

      var url = "https://wa.me/" + whatsapp + "?text=" + encodeURIComponent(lines.join("\n"));
      var opened = window.open(url, "_blank");
      status.replaceChildren();

      if (opened) {
        opened.opener = null;
        status.textContent = "WhatsApp s’ouvre avec votre candidature. Pensez à joindre vos deux photos dans la conversation.";
      } else {
        var link = document.createElement("a");
        link.href = url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = "Ouvrir WhatsApp avec votre candidature";
        status.append("Le navigateur a bloqué la fenêtre. ", link, ".");
      }

      status.setAttribute("tabindex", "-1");
      status.focus();
    });
  }

  function initImages() {
    document.querySelectorAll("img").forEach(function (img) {
      img.addEventListener("error", function () {
        img.classList.add("is-missing");
      });
    });
  }

  function initAnnee() {
    var year = document.getElementById("annee");
    if (year) year.textContent = String(new Date().getFullYear());
  }

  function trapFocus(container, event) {
    var nodes = Array.prototype.filter.call(
      container.querySelectorAll("a[href], button:not([disabled])"),
      function (el) {
        return !el.closest("[inert]") && el.getClientRects().length > 0;
      }
    );
    if (!nodes.length) return;
    var first = nodes[0];
    var last = nodes[nodes.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
})();
