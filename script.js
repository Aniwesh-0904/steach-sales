// Toggle Products dropdown on click (works alongside CSS :hover for touch devices)
document.addEventListener('DOMContentLoaded', function () {
  var menuToggle = document.querySelector('.menu-toggle');
  var navLinks = document.querySelector('.nav-links');
  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', function () {
      var isOpen = navLinks.classList.toggle('open');
      menuToggle.setAttribute('aria-expanded', String(isOpen));
      menuToggle.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
    });

    navLinks.addEventListener('click', function (e) {
      if (e.target.closest('a') && !e.target.closest('.dropdown-toggle')) {
        navLinks.classList.remove('open');
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.setAttribute('aria-label', 'Open navigation');
      }
    });
  }

  var dropdownParent = document.querySelector('.has-dropdown');
  var toggle = document.querySelector('.dropdown-toggle');
  if (toggle && dropdownParent) {
    toggle.addEventListener('click', function (e) {
      e.preventDefault();
      dropdownParent.classList.toggle('open');
    });
  }
  // close dropdown when clicking outside of it
  document.addEventListener('click', function (e) {
    if (dropdownParent && !dropdownParent.contains(e.target)) {
      dropdownParent.classList.remove('open');
    }
  });

  // ---------- Product photos: preload, only swap in if it actually loads ----------
  var hexPhotos = document.querySelectorAll('.hex-photo[data-img], .product-photo[data-img], .client-logo[data-img]');
  hexPhotos.forEach(function (el) {
    var testImg = new Image();
    var src = el.getAttribute('data-img');
    testImg.onload = function () {
      el.style.backgroundImage = 'url(' + src + ')';
      el.textContent = '';
    };
    testImg.src = src;
    // if the image fails to load, the metal-gradient placeholder stays visible
  });

  // ---------- Scroll-reveal for the product hex cards ----------
  var revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length) {
    // Only now do we hide them — if this code never runs, they were
    // already visible by default from the plain CSS, so nothing breaks.
    revealEls.forEach(function (el) {
      el.classList.add('pre-reveal');
    });
    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1 });
      revealEls.forEach(function (el) {
        observer.observe(el);
      });
    } else {
      revealEls.forEach(function (el) {
        el.classList.add('in-view');
      });
    }
    // Fail-safe: whatever hasn't revealed itself within 2.5s (observer
    // didn't fire, layout quirk, etc.) gets shown anyway.
    setTimeout(function () {
      revealEls.forEach(function (el) {
        el.classList.add('in-view');
      });
    }, 2500);
  }

  // ---------- Ember particles (forge-spark theme, replaces the old cursor blob) ----------
  var emberField = document.querySelector('.ember-field');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (emberField && !reduceMotion) {
    function spawnEmber() {
      var ember = document.createElement('div');
      ember.className = 'ember';
      var startX = Math.random() * window.innerWidth;
      var drift = (Math.random() * 60 - 30) + 'px';
      var duration = 4 + Math.random() * 3; // seconds
      var size = 2 + Math.random() * 3; // px
      ember.style.left = startX + 'px';
      ember.style.width = size + 'px';
      ember.style.height = size + 'px';
      ember.style.setProperty('--drift', drift);
      ember.style.animationDuration = duration + 's';
      emberField.appendChild(ember);
      // clean up after the animation finishes
      setTimeout(function () {
        ember.remove();
      }, duration * 1000);
    }
    // spawn a new ember every ~350ms, kept subtle rather than a snowstorm
    setInterval(spawnEmber, 350);
  }

  // ---------- Contact form: no backend yet, so just confirm + reset ----------
  var contactForm = document.getElementById('contactForm');
  var contactFormNote = document.getElementById('contactFormNote');

  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();

      if (contactFormNote) {
        contactFormNote.textContent = "Thanks! Your message has been received — we'll get back to you shortly.";
      }
      contactForm.reset();

      // clear the note after a while so it doesn't sit there forever
      setTimeout(function () {
        if (contactFormNote) {
          contactFormNote.textContent = '';
        }
      }, 6000);
    });
  }

  // ---------- Scroll-driven hex assembly: scattered -> single row ----------
  var hero = document.querySelector('.hero');
  var assembleHexes = document.querySelectorAll('.hex-item[data-start-top]');
  var hexClusterHeading = document.getElementById('hexClusterHeading');
  var reduceMotionAssembly = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (hero && assembleHexes.length && !reduceMotionAssembly) {
    var ticking = false;

    function updateHexAssembly() {
      ticking = false;

      // On small screens the cluster switches to a static stacked layout
      // (see the 760px breakpoint in style.css) — leave it alone there.
      if (window.innerWidth <= 760) {
        assembleHexes.forEach(function (el) {
          el.style.top = '';
          el.style.left = '';
          el.style.removeProperty('--item-scale');
        });
        if (hexClusterHeading) {
          hexClusterHeading.style.opacity = '';
        }
        return;
      }

      var rect = hero.getBoundingClientRect();
      var winH = window.innerHeight;
      var scrollable = rect.height - winH;
      var progress;

      if (scrollable <= 0) {
        progress = rect.top <= 0 ? 1 : 0;
      } else {
        progress = -rect.top / scrollable;
      }
      progress = Math.max(0, Math.min(1, progress));

      // hexes start at full size and shrink slightly as they assemble
      var startScale = 1;
      var endScale = 0.78;
      var scale = startScale + (endScale - startScale) * progress;

      assembleHexes.forEach(function (el) {
        var st = parseFloat(el.dataset.startTop);
        var sl = parseFloat(el.dataset.startLeft);
        var et = parseFloat(el.dataset.endTop);
        var elft = parseFloat(el.dataset.endLeft);

        el.style.top = (st + (et - st) * progress) + 'px';
        el.style.left = (sl + (elft - sl) * progress) + '%';
        el.style.setProperty('--item-scale', scale);
      });

      if (hexClusterHeading) {
        hexClusterHeading.style.opacity = progress;
      }
    }

    function requestHexUpdate() {
      if (!ticking) {
        window.requestAnimationFrame(updateHexAssembly);
        ticking = true;
      }
    }

    window.addEventListener('scroll', requestHexUpdate, { passive: true });
    window.addEventListener('resize', requestHexUpdate);
    updateHexAssembly();
  }

  // ---------- Gallery modal: open on "Gallery" nav click, close on X /
  // backdrop click / Escape, and hand off cleanly to the "Contact Us" CTA ----------
  var galleryTrigger = document.getElementById('galleryTrigger');
  var galleryModal = document.getElementById('galleryModal');
  var galleryClose = document.getElementById('galleryClose');
  var galleryContactBtn = document.getElementById('galleryContactBtn');

  if (galleryTrigger && galleryModal) {
    function openGallery(e) {
      if (e) e.preventDefault();
      galleryModal.classList.add('open');
      document.body.style.overflow = 'hidden'; // lock background scroll while open
    }

    function closeGallery() {
      galleryModal.classList.remove('open');
      document.body.style.overflow = '';
    }

    galleryTrigger.addEventListener('click', openGallery);

    if (galleryClose) {
      galleryClose.addEventListener('click', closeGallery);
    }

    // click on the dark backdrop (outside the white card) closes it too
    galleryModal.addEventListener('click', function (e) {
      if (e.target === galleryModal) {
        closeGallery();
      }
    });

    // Escape key closes it
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && galleryModal.classList.contains('open')) {
        closeGallery();
      }
    });

    // "Contact Us" button inside the gallery: close the modal first, then
    // let the page scroll smoothly to the actual Contact section behind it
    if (galleryContactBtn) {
      galleryContactBtn.addEventListener('click', function (e) {
        e.preventDefault();
        closeGallery();
        var contactSection = document.getElementById('contact');
        if (contactSection) {
          // small delay so the modal's fade-out doesn't fight the scroll
          setTimeout(function () {
            contactSection.scrollIntoView({ behavior: 'smooth' });
          }, 150);
        }
      });
    }
  }
});