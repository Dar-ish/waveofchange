/* ===================================================================
   NAVBAR: SCROLL FILL + SMOOTH HASH SCROLL + CURRENT YEAR
   =================================================================== */

// Fill navbar after scrolling
const nav = document.getElementById("mainNav")
const onScroll = () => {
	if (window.scrollY > 40) nav.classList.add("scrolled")
	else nav.classList.remove("scrolled")
}
document.addEventListener("scroll", onScroll)
onScroll()

// Current year
document.getElementById("year").textContent = new Date().getFullYear()

// Smooth-scroll fix for browsers that ignore CSS behavior on hash links (Safari)
document.querySelectorAll('a[href^="#"]').forEach((a) => {
	a.addEventListener("click", (e) => {
		const id = a.getAttribute("href")
		if (id.length > 1) {
			const el = document.querySelector(id)
			if (el) {
				e.preventDefault()
				const y = el.getBoundingClientRect().top + window.pageYOffset - 72 // offset under navbar
				window.scrollTo({ top: y, behavior: "smooth" })
				history.pushState(null, "", id)
			}
		}
	})
})


/* ===================================================================
   AMBIENT AUDIO: TOGGLE + START ON USER GESTURE
   =================================================================== */

const audio = document.getElementById("ambientAudio")
const soundBtn = document.getElementById("soundBtn") // now an <sl-toggle>

// Helper: sync the toggle's checked state with audio.muted
function syncToggle() {
	// Convention: checked === true means SOUND ON (unmuted)
	if (typeof soundBtn?.checked === "boolean") {
		soundBtn.checked = !audio.muted
	} else if (soundBtn) {
		// fallback for non-Shoelace (shouldn't happen)
		soundBtn.classList.toggle("muted", audio.muted)
	}
}

syncToggle()

// Start playing once user interacts anywhere (keeps it subtle)
const startAudioOnce = () => {
	audio.play().catch(() => {
		/* ignore */
	})
	document.removeEventListener("pointerdown", startAudioOnce)
	document.removeEventListener("keydown", startAudioOnce)
}
document.addEventListener("pointerdown", startAudioOnce, { once: true })
document.addEventListener("keydown", startAudioOnce, { once: true })

// When the user toggles the Shoelace toggle, update audio.muted
if (soundBtn) {
	// listen for Shoelace change event
	soundBtn.addEventListener("sl-change", (e) => {
		// Checked = SOUND ON (unmuted)
		const isChecked = e.target.checked
		audio.muted = !isChecked
		// When turning sound on, attempt to play (will only work after a user gesture)
		if (isChecked) {
			audio.play().catch(() => {})
		}
	})

	// Keep toggle in sync if audio.muted changes programmatically elsewhere
	// (e.g., autoplay policies or other scripts)
	const observer = new MutationObserver(() => syncToggle())
	observer.observe(audio, { attributes: true, attributeFilter: ["muted"] })
}


/* ===================================================================
   NAV: MOBILE MENU BEHAVIOR (CLOSE ON INTERNAL LINK)
   =================================================================== */

;(function () {
	const navContent = document.getElementById("navContent")
	if (!navContent) return

	// close nav when internal anchor is clicked (so it doesn't leave menu open)
	navContent.querySelectorAll('a[href^="#"]').forEach((a) => {
		a.addEventListener("click", () => {
			// close the main collapse (mobile menu)
			const bs = bootstrap.Collapse.getInstance(navContent)
			if (bs) bs.hide()

			// also close any open dropdowns inside the nav
			const ddToggle = a.closest(".dropdown-menu")?.previousElementSibling
			if (ddToggle && ddToggle.getAttribute("data-bs-toggle") === "dropdown") {
				const dd = bootstrap.Dropdown.getInstance(ddToggle)
				if (dd) dd.hide()
			}
		})
	})
})()


/* ===================================================================
   GSAP ANIMATIONS: WAVES ON LOAD
   =================================================================== */

// GSAP: staggered entrance for wave layers (slide up one-by-one)
function animateWavesOnLoad() {
	// ensure gsap is available
	if (typeof gsap === "undefined") return

	const waves = document.querySelectorAll(".wave-img")
	if (!waves || waves.length === 0) return

	// Set initial state: start slightly lower than their final CSS position
	gsap.set(waves, { yPercent: 15, opacity: 0 })

	// Create a timeline that brings each wave up in sequence
	const tl = gsap.timeline({ defaults: { duration: 0.9, ease: "power2.out" } })
	tl.to(waves, { yPercent: 0, opacity: 1, stagger: 0.18 })

	// After the entry animation, start a subtle continuous bobbing effect
	tl.call(() => {
		const bobSettings = [
			{ y: 2.0, duration: 5.0 },
			{ y: 1.6, duration: 4.2 },
			{ y: 1.2, duration: 3.6 },
			{ y: 0.9, duration: 3.0 },
		]

		waves.forEach((el, i) => {
			const s = bobSettings[i] || { y: 1.0, duration: 5.0 }
			gsap.to(el, {
				// move relative to current position using yPercent; small amplitude
				yPercent: `+=${s.y}`,
				duration: s.duration,
				ease: "sine.inOut",
				yoyo: true,
				repeat: -1,
				repeatDelay: 0,
				yoyoEase: "sine.inOut",
			})
		})
	})
}

// Run wave animation after window load so images and layout are settled
window.addEventListener(
	"load",
	() => {
		// small timeout to allow any font/layout shifts to finish
		setTimeout(animateWavesOnLoad, 120)
	},
	{ once: true }
)


/* ===================================================================
   GSAP ANIMATIONS: HERO LOGO PARALLAX
   =================================================================== */

// Simple parallax for hero logo using GSAP ScrollTrigger
function setupHeroLogoParallax() {
	if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined")
		return

	// Register ScrollTrigger if not already
	if (!gsap.core.globals || !gsap.core.globals().ScrollTrigger) {
		try {
			gsap.registerPlugin(ScrollTrigger)
		} catch (e) {
			// ignore if already registered or not available
		}
	}

	const logo = document.querySelector(".hero-logo")
	if (!logo) return

	// small parallax: logo moves slower than scroll (negative yPercent)
	gsap.to(logo, {
		yPercent: -102,
		ease: "none",
		scrollTrigger: {
			trigger: ".hero",
			start: "top top",
			end: "bottom top",
			scrub: 0.6,
		},
	})
}

window.addEventListener(
	"load",
	() => {
		// set up the parallax after load
		setTimeout(setupHeroLogoParallax, 160)
	},
	{ once: true }
)


/* ===================================================================
   GSAP ANIMATIONS: NAVBAR FADE-IN ON LOAD
   =================================================================== */

function animateNavbarOnLoad() {
	if (typeof gsap === "undefined") return

	const brand = document.querySelector(".navbar-brand")
	const toggler = document.querySelector(".navbar-toggler")
	const navLinks = document.querySelectorAll("#navContent .nav-link")
	const sound = document.getElementById("soundBtn")

	const tl = gsap.timeline({ defaults: { duration: 0.55, ease: "power3.out" } })
	// fade/slide brand and toggler in
	tl.from([brand, toggler], { y: -12, opacity: 0, stagger: 0.08 })
	// nav links (staggered)
	tl.from(navLinks, { y: -8, opacity: 0, stagger: 0.06 }, "-=0.25")
	// sound switch
	if (sound) tl.from(sound, { scale: 0.9, opacity: 0, duration: 0.4 }, "-=0.3")
}

window.addEventListener(
	"load",
	() => {
		setTimeout(animateNavbarOnLoad, 180)
	},
	{ once: true }
)


/* ===================================================================
   SCROLL REVEAL (INTERSECTION OBSERVER)
   =================================================================== */

;(function () {
	const prefersReduced =
		window.matchMedia &&
		window.matchMedia("(prefers-reduced-motion: reduce)").matches

	function setupReveal() {
		const items = document.querySelectorAll(".reveal-on-scroll")
		if (!items.length) return

		// If reduced motion, show immediately
		if (prefersReduced) {
			items.forEach((el) => el.classList.add("is-visible"))
			return
		}

		const io = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						entry.target.classList.add("is-visible")
						// Once visible, unobserve to avoid re-trigger
						io.unobserve(entry.target)
					}
				})
			},
			{
				root: null,
				rootMargin: "0px 0px -10% 0px",
				threshold: 0.12,
			}
		)

		items.forEach((el) => io.observe(el))
	}

	// Run after DOM is ready
	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", setupReveal, { once: true })
	} else {
		setupReveal()
	}
})()


/* ===================================================================
   BUBBLES: INTERACTIVITY (REPEL + POP)
   =================================================================== */

;(function () {
	const layer = document.querySelector(".bubble-layer")
	if (!layer) return

	// parameters
	const REPel_RADIUS = 120 // px
	const REPel_STRENGTH = 0.45

	let pointer = { x: -9999, y: -9999 }
	let ticking = false

	function updatePointer(e) {
		// support both mouse and touch
		const p = e.touches ? e.touches[0] : e
		pointer.x = p.clientX
		pointer.y = p.clientY
		if (!ticking) {
			requestAnimationFrame(runRepel)
			ticking = true
		}
	}

	function runRepel() {
		const bubbles = layer.querySelectorAll(".bubble")
		bubbles.forEach((b) => {
			const rect = b.getBoundingClientRect()
			const bx = rect.left + rect.width / 2
			const by = rect.top + rect.height / 2
			const dx = bx - pointer.x
			const dy = by - pointer.y
			const dist = Math.sqrt(dx * dx + dy * dy)
			if (dist < REPel_RADIUS) {
				const force = (1 - dist / REPel_RADIUS) * REPel_STRENGTH
				const tx = (dx / dist) * force * 120 // scaled nudge
				const ty = (dy / dist) * force * 120
				// apply transform using GSAP if available for smoothness
				if (typeof gsap !== "undefined") {
					gsap.to(b, {
						x: `+=${tx}`,
						y: `+=${ty}`,
						duration: 0.45,
						ease: "power2.out",
					})
				} else {
					b.classList.add("repel")
					// apply inline transform (preserve translateY from animation by appending)
					const current = b.style.transform || ""
					b.style.transform = `${current} translate(${tx}px, ${ty}px)`
					setTimeout(() => b.classList.remove("repel"), 420)
				}
			}
		})
		ticking = false
	}

	// pop on click/tap
	function popBubble(e) {
		const target = e.target
		if (!target.classList.contains("bubble")) return

		// prevent pointer events reaching underlying elements
		e.stopPropagation()

		if (typeof gsap !== "undefined") {
			gsap.to(target, {
				scale: 1.6,
				opacity: 0,
				duration: 0.28,
				ease: "power2.out",
				onComplete: () => target.remove(),
			})
		} else {
			target.classList.add("pop")
			setTimeout(() => target.remove(), 360)
		}
	}

	// attach listeners
	window.addEventListener("pointermove", updatePointer, { passive: true })
	window.addEventListener("touchmove", updatePointer, { passive: true })
	layer.addEventListener("click", popBubble)
	layer.addEventListener("touchstart", popBubble)
})()


/* ===================================================================
   BUBBLES: LAYER PARALLAX (GSAP ScrollTrigger)
   =================================================================== */

;(function () {
	function setupBubbleParallax() {
		const layer = document.querySelector(".bubble-layer")
		if (!layer) return

		if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined")
			return

		// Register ScrollTrigger if needed
		try {
			if (!gsap.core.globals || !gsap.core.globals().ScrollTrigger) {
				gsap.registerPlugin(ScrollTrigger)
			}
		} catch (e) {
			// ignore
		}

		// disable on small screens
		if (window.matchMedia && window.matchMedia("(max-width: 768px)").matches)
			return

		// subtle vertical parallax: bubble-layer moves slower than page content
		gsap.to(layer, {
			yPercent: -12,
			ease: "none",
			scrollTrigger: {
				trigger: document.body,
				start: "top top",
				end: "bottom top",
				scrub: 0.6,
			},
		})
	}

	window.addEventListener(
		"load",
		() => {
			// delay slightly so bubble-layer exists and layout stabilizes
			setTimeout(setupBubbleParallax, 220)
		},
		{ once: true }
	)
})()


/* ===================================================================
   BUBBLES: RANDOMIZED SPAWNING + FALLBACK
   =================================================================== */

;(function () {
	const MAX_BUBBLES = 5 // total bubbles to keep alive
	const SPAWN_INTERVAL = 900 // ms between spawn attempts

	// create bubble-layer container once
	let layer = document.querySelector(".bubble-layer")
	if (!layer) {
		layer = document.createElement("div")
		layer.className = "bubble-layer"
		document.body.appendChild(layer)
	}

	function rand(min, max) {
		return Math.random() * (max - min) + min
	}

	function createBubble() {
		const b = document.createElement("div")
		b.className = "bubble"

		// randomize size
		const size = Math.round(rand(18, 92)) // px
		b.style.width = size + "px"
		b.style.height = size + "px"

		// start at random horizontal position (allow overflow slightly)
		const left = rand(-6, 106) // percent (allows off-screen spawn)
		b.style.left = left + "%"

		// start near bottom with a small vertical jitter
		b.style.bottom = rand(-10, 6) + "%"

		// subtle rotation
		b.style.transform = `translateY(0) rotate(${rand(-20, 20)}deg)`

		layer.appendChild(b)

		// animate using GSAP if available
		if (typeof gsap !== "undefined") {
			const duration = rand(6, 18)
			const delay = 0
			// horizontal drift while rising
			const drift = rand(-8, 8)

			gsap.to(b, {
				y: `-=${window.innerHeight + 200}`,
				x: `+=${drift}`,
				rotation: rand(-40, 40),
				opacity: 0,
				duration: duration,
				ease: "power1.out",
				onComplete: () => b.remove(),
			})
		} else {
			// fallback: use CSS keyframe animation and remove after duration
			b.classList.add("fallback")
			const duration = rand(8, 20)
			b.style.setProperty("--bubble-duration", duration + "s")
			// remove after animation finishes
			setTimeout(() => {
				b.remove()
			}, duration * 1000 + 200)
		}

		// attach per-bubble interactivity handlers (pop on pointerdown)
		b.addEventListener(
			"pointerdown",
			(e) => {
				e.stopPropagation()
				if (typeof gsap !== "undefined") {
					gsap.to(b, {
						scale: 1.6,
						opacity: 0,
						duration: 0.28,
						ease: "power2.out",
						onComplete: () => b.remove(),
					})
				} else {
					b.classList.add("pop")
					setTimeout(() => b.remove(), 360)
				}
			},
			{ passive: true }
		)
	}

	// maintain a limited number of bubbles
	setInterval(() => {
		const alive = layer.querySelectorAll(".bubble").length
		if (alive < MAX_BUBBLES) createBubble()
	}, SPAWN_INTERVAL)

	// initial burst
	for (let i = 0; i < 8; i++) createBubble()

	// pause spawning when page is hidden to save CPU
	document.addEventListener("visibilitychange", () => {
		if (document.hidden) {
			// remove all GSAP tweens to reduce CPU; let existing bubbles fade
			if (typeof gsap !== "undefined") gsap.globalTimeline.pause()
		} else {
			if (typeof gsap !== "undefined") gsap.globalTimeline.resume()
		}
	})
})()


/* ===================================================================
   PROBLEMS SECTION: EYE TRACKING
   =================================================================== */

;(function () {
	const wrap = document.querySelector(".problems-eye-wrap")
	const eye = document.querySelector(".problems-eye-wrap .eye")
	if (!wrap || !eye) return

	// Respect reduced motion preference
	const prefersReduced =
		window.matchMedia &&
		window.matchMedia("(prefers-reduced-motion: reduce)").matches
	if (prefersReduced) return

	// If your eye asset has its "forward" direction not pointing right,
	// tweak this offset (deg). Positive is clockwise. Try values: -90, 0, 90, 180.
	const ROTATION_OFFSET_DEG = 40

	// Helper to compute center of the eye wrap
	function getCenter() {
		const r = wrap.getBoundingClientRect()
		return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
	}

	let rafPending = false
	let targetAngle = 0

	function onPointerMove(e) {
		const p = e.touches ? e.touches[0] : e
		const c = getCenter()
		const dx = p.clientX - c.x
		const dy = p.clientY - c.y
		// atan2 gives angle in radians; convert to degrees and add offset
		targetAngle = Math.atan2(dy, dx) * (180 / Math.PI) + ROTATION_OFFSET_DEG
		if (!rafPending) {
			rafPending = true
			requestAnimationFrame(updateRotation)
		}
	}

	function updateRotation() {
		rafPending = false
		// Apply a subtle limit to avoid excessive spin if desired
		const angle = targetAngle
		if (typeof gsap !== "undefined") {
			gsap.to(eye, {
				rotation: angle,
				transformOrigin: "50% 50%",
				duration: 0.18,
				ease: "power2.out",
			})
		} else {
			// Lightweight fallback: direct style transform
			eye.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`
		}
	}

	// Initialize with neutral rotation including offset
	if (typeof gsap !== "undefined") {
		gsap.set(eye, { transformOrigin: "50% 50%", rotation: ROTATION_OFFSET_DEG })
	} else {
		eye.style.transform = `translate(-50%, -50%) rotate(${ROTATION_OFFSET_DEG}deg)`
	}

	// Attach listeners on the document so tracking works across the section
	window.addEventListener("pointermove", onPointerMove, { passive: true })
	window.addEventListener("touchmove", onPointerMove, { passive: true })
})()


/* ===================================================================
   HELP VIDEO: THUMBNAIL -> DIALOG (AUTOPLAY)
   =================================================================== */

;(function () {
	const thumb = document.getElementById("helpVideoThumb")
	const rotator = thumb // rotator is now the clickable element
	const dialog = document.getElementById("helpVideoDialog")
	const frame = document.getElementById("helpVideoFrame")
	if (!thumb || !dialog || !frame) return

	// remember ambient audio state so we can restore it
	let prevAudioMuted = true
	let prevAudioWasPlaying = false

	function openDialogWithPulse() {
		// pulse animation
		thumb.classList.remove("pulsing")
		// force reflow to restart animation
		void thumb.offsetWidth
		thumb.classList.add("pulsing")

		// small delay to let the pulse be visible
		setTimeout(() => {
			// pause ambient audio so only video plays
			try {
				if (audio) {
					prevAudioMuted = audio.muted
					prevAudioWasPlaying = !audio.paused
					audio.pause()
				}
			} catch (_) {}

			// set iframe src to start playback
			const src = frame.getAttribute("data-src")
			if (src && !frame.getAttribute("src")) frame.setAttribute("src", src)
			// open Shoelace dialog
			if (typeof dialog.show === "function") dialog.show()
			else dialog.setAttribute("open", "")
		}, 140)

		// remove pulse after it finishes so scale returns to normal
		setTimeout(() => {
			thumb.classList.remove("pulsing")
		}, 260)
	}

	thumb.addEventListener("click", openDialogWithPulse)
	thumb.addEventListener("keydown", (e) => {
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault()
			openDialogWithPulse()
		}
	})

	// When dialog hides, clear the iframe src to stop the video
	dialog.addEventListener("sl-after-hide", () => {
		frame.removeAttribute("src")
		// restore ambient audio state
		try {
			if (audio) {
				audio.muted = prevAudioMuted
				if (prevAudioWasPlaying) audio.play().catch(() => {})
			}
		} catch (_) {}

		// ensure the spinner keeps spinning after closing
		try {
			thumb.classList.remove("pulsing")
			thumb.style.animationPlayState = "running"
		} catch (_) {}
	})
})()


/* ===================================================================
   RESPONSIVE / MEDIA AT BOTTOM:
   PHOTOS SCROLL SEQUENCE (GSAP + ScrollTrigger + matchMedia)
   =================================================================== */

// Register GSAP + ScrollTrigger and build the scroll-driven photo sequence
document.addEventListener("DOMContentLoaded", () => {
	if (!window.gsap || !window.ScrollTrigger) {
		console.warn("GSAP or ScrollTrigger not loaded.")
		return
	}

	gsap.registerPlugin(ScrollTrigger)

	const photosSection = document.querySelector("#photos")
	const images = gsap.utils.toArray(".photos-stage .photo-img")

	if (!photosSection || images.length === 0) return

	const mm = gsap.matchMedia()

	// Build animations per media query for responsiveness and accessibility
	mm.add(
		{
			// breakpoints
			isMobile: "(max-width: 599.98px)",
			isTablet: "(min-width: 600px) and (max-width: 1023.98px)",
			isDesktop: "(min-width: 1024px)",
			// reduced motion
			reduce: "(prefers-reduced-motion: reduce)",
		},
		(ctx) => {
			const { reduce, isMobile, isTablet, isDesktop } = ctx.conditions

			// Responsive values
			const xOffset = reduce ? 0 : isMobile ? 10 : isTablet ? 8 : 6 // xPercent
			const outScale = reduce ? 1 : 1.02
			const inScaleFrom = reduce ? 1 : 1.08
			const inDur = reduce ? 0.2 : isMobile ? 0.9 : 0.8
			const outDur = reduce ? 0.15 : 0.4
			const scrub = reduce ? false : 1

			// Initial state
			gsap.set(images, { opacity: 0, scale: inScaleFrom, xPercent: xOffset })
			gsap.set(images[0], { opacity: 1, scale: 1, xPercent: 0 })

			// Timeline: pin section and reveal images
			const revealCount = Math.max(images.length - 1, 1)
			const tl = gsap.timeline({
				scrollTrigger: {
					trigger: photosSection,
					start: "top top",
					end: () => `+=${window.innerHeight * revealCount}`,
					scrub,
					pin: true,
					anticipatePin: 1,
				},
				defaults: { ease: reduce ? "none" : "power2.out" },
			})

			images.forEach((img, i) => {
				if (i === 0) return

				tl.addLabel(`img${i}`)
					.to(images[i - 1], { scale: outScale, duration: outDur }, `img${i}`)
					.fromTo(
						img,
						{ opacity: 0, scale: inScaleFrom, xPercent: xOffset },
						{ opacity: 1, scale: 1, xPercent: 0, duration: inDur },
						`img${i}`
					)
			})

			// Ensure last image is steady on leave
			ScrollTrigger.create({
				trigger: photosSection,
				start: "top top",
				end: () => `+=${window.innerHeight * revealCount}`,
				onLeave: () =>
					gsap.to(images[images.length - 1], {
						opacity: 1,
						scale: 1,
						duration: 0.2,
					}),
			})

			// Cleanup handled by matchMedia automatically
		}
	)

	// Handle resize: update ScrollTrigger positions
	window.addEventListener("resize", () => {
		ScrollTrigger.refresh()
	})
})
