---
title: "Building StarLenz: From a Graphic Design Concept to an Interactive Web Experience"
description: "How a graphic design concept evolved into an interactive astronomy experience through responsive design, animated space environments, constellation mapping, and repeated UI refinement."
date: 2026-08-18
project: StarLenz
featured: true
tags:
  - StarLenz
  - Frontend Development
  - UI/UX
  - Next.js
  - Motion Design
  - Graphic Design
coverImage: "generated:starlenz"
---

## Introduction

StarLenz began as a graphic design project. The brief I gave myself was a mobile astronomy app: constellations you could tap, individual stars you could inspect, and a sky that felt close enough to reach into. The mockups leaned into bright cosmic gradients, dense star fields, and glowing stellar blooms. It was a visual identity first — a look, a mood, a set of screens.

While preparing work for this portfolio, I kept coming back to those frames. The concept had more in it than a static presentation. The constellations wanted to be data. The stars wanted names. The sky wanted to move, but only as much as the interface could afford.

The goal shifted. Keep the identity of the original design. Rebuild it as a real web experience. Add interaction and enough educational depth that a tap on Orion actually means something.

This is a development update, not a launch post. StarLenz is still being built. What follows is the path from those original screens to the interactive system taking shape now — including the decisions I reversed.

## 1. Starting With the Original Design

The original mobile mockups established the StarLenz identity before a single route existed.

The visual language was already specific:

- Deep blue and violet backgrounds
- Cyan, gold, pink, and purple gradients
- Dense stars and bright stellar blooms
- Constellation imagery as the primary subject
- Simple bottom navigation
- Futuristic typography

That identity was the asset. The mistake would have been to treat the mockups as a specification to photocopy onto a website.

Copying mobile screens onto a desktop canvas almost always fails. Padding inflates. Hierarchy collapses. Backgrounds that felt rich at phone width become empty or overpowering at 1200 pixels. The job was translation: keep the feeling, change the composition.

![Original StarLenz constellation screens from the mobile design](placeholder:starlenz/original-constellations.png)

![Original StarLenz profile screen from the mobile design](placeholder:starlenz/original-profile.png)

Those frames still sit next to the running app. When a visual decision gets noisy, I go back to them. They are the identity. The website has to earn the same recognition without pretending it is still a phone.

## 2. Translating StarLenz to the Web

A fixed mobile mockup has one width, one thumb zone, and one visual center. A website has none of those guarantees.

The first desktop layouts exposed the gaps immediately:

- Spacing that felt generous on a phone became sparse on a wide screen
- Hierarchy that relied on stacked screens needed a calmer editorial structure
- The celestial background had to stay interesting at larger dimensions without swallowing the type
- Constellation viewers needed to respond to the frame they lived in
- Interaction still had to work with a thumb, not only a cursor
- Body copy had to remain readable over colorful gradients

I did not want a stretched phone UI. The desktop experience needed to feel like StarLenz with more sky — a telescope viewport rather than an enlarged mockup. Navigation moved out of a bottom bar into a pattern the rest of the product could support. The constellation frame became the focal object. Copy sat below it, not competing with it.

Mobile-first still mattered. If the constellation could not be selected comfortably on a phone, the desktop version was not finished either.

![Current StarLenz desktop constellation experience](placeholder:starlenz/current-desktop.png)

## 3. Building the Celestial Background

The background was the first thing that looked “done” and the first thing that was wrong.

The initial recreation of the gradient was too clean and too dominant. Early desktop versions felt closer to a gradient with a few stars than an environment in space. Pretty, but flat. You could feel the illustration sitting on a rectangle.

I refined it in layers:

- Deeper base colors so the sky had weight
- More star density, with stars at different brightness levels
- Large stellar blooms used sparingly
- Drifting cosmic dust
- Irregular nebula haze instead of a smooth wash
- Layered depth so near and far stars did not occupy the same plane
- Slow atmospheric movement rather than a looping spectacle

Then a second problem appeared. Too much background activity competes with the content. A sky that never rests makes every heading feel like it is shouting over weather.

That forced a hierarchy I now treat as a rule:

1. Content first
2. Interaction second
3. Stars and atmosphere third
4. Gradient last

If the gradient is the loudest element on the page, the environment has won and the product has lost.

![Animated celestial background iterations](placeholder:starlenz/background-atmosphere.png)

## 4. Defining the StarLenz Interaction Language

This portfolio has a clear interaction language: black glass, electric yellow, and a fairly luxurious kind of restraint. StarLenz could have borrowed that language directly. It would have been faster. It also would have made StarLenz look like a themed section of this site rather than its own product.

StarLenz needed its own palette of emphasis.

The portfolio uses:

- Black glass
- Electric yellow
- Luxury-tech interactions

StarLenz developed:

- Celestial glass
- Blue and violet atmosphere
- Gold interaction accents

Gold is not decoration. It means focus, discovery, an active state, a selected star, a navigation cue you should notice. The environment stays blue, violet, and cyan. Information stays primarily white. Gold is interaction.

That split sounds small. It prevents a common failure in visually rich apps: when every glow is “important,” nothing is. Once gold was reserved for action, the rest of the sky could stay atmospheric without competing for attention.

## 5. Turning Constellations Into an Interface

At the beginning, constellation images were mostly visual. Beautiful stick figures. Not yet a system.

The project evolved toward structured constellation data. Instead of generic clickable dots, each meaningful point can correspond to a real named star. Orion is the working example:

- Betelgeuse
- Bellatrix
- Mintaka
- Alnilam
- Alnitak
- Rigel
- Saiph
- Meissa

The data describes more than a picture. Each constellation carries normalized X/Y positions, star identity, line connections, stellar classification, system type, and a navigation route. The renderer consumes that description. It does not hardcode a special Orion component.

The conceptual flow is simple on purpose:

Constellation data → renderer → interactive star point → star detail page

That is the difference between an illustration of a constellation and an interface for exploring one. If the data is honest, the visualization can stay responsive. If the data is a pile of magic numbers, every new constellation becomes a one-off.

![Interactive constellation mapping in the gold frame](placeholder:starlenz/constellation-interaction.png)

## 6. Responsive Constellation Mapping

One problem showed up after a change that was otherwise correct.

I improved the accuracy of Orion’s star positions — the belt, the shoulders, the head, the feet, the sword. The mapping got better. The composition got worse. Orion occupied only a small portion of its frame. The gold viewport felt like a large patch of sky with a tiny figure floating in the middle.

The solution was not to remap the stars again. The identities and connections were finally in a place I trusted. What needed to change was presentation: a reusable fit-to-frame camera.

The idea is straightforward:

1. Determine the bounding area of the important constellation points.
2. Fit that shape into the available frame.
3. Preserve aspect ratio — no independent stretching on X or Y.
4. Keep safe padding so stars approach the frame without touching it.
5. Ignore decorative background stars when calculating the bounds.

That last rule matters. If field stars and dust participate in the bounding box, the algorithm treats the whole sky as the subject and shrinks the constellation again.

A hardcoded `Orion scale = 1.8` would have fixed one page and guaranteed the next constellation would be wrong. Cassiopeia is wide. The Southern Cross is compact. Scorpius curves. A fitting system lets each figure occupy the viewport according to its own shape.

```ts
const viewH = Math.max(
  bounds.height / targetHeight,
  bounds.width / (targetWidth * frameAspect),
);
```

The viewBox then matches the frame’s aspect ratio so the SVG fills the gold viewport. The constellation scales uniformly inside it. Padding is a function of the frame, not a special case per silhouette.

## 7. Going Deeper: From Constellation to Star

The navigation depth is the product.

Constellation Catalog → Constellation → Star → Star System

Clicking an important constellation point should feel like traveling toward that object, not like swapping templates. The zoom originates from the clicked star’s position rather than always rushing toward the center of the screen. If you select Rigel, the camera should move toward Rigel.

That sounds obvious after the fact. The first versions were less intentional. A centered zoom is easier to code and easier to notice as fake. Originating from the selected point is a small geometric choice with a large perceptual payoff. It is one of the few motions in StarLenz I consider load-bearing.

![Star detail page after traveling from the constellation](placeholder:starlenz/star-detail.png)

## 8. Learning When to Remove Animation

This was the most useful mistake.

The first version of the star transition became too elaborate. It stacked:

- Constellation zoom
- Stellar bloom
- A white sphere transition
- A page transition
- An animated stellar surface
- Corona movement
- Orbital motion

Individually, each idea had a reason. Together they were a light show. By the time the star page arrived, the object itself had been upstaged by the journey.

More motion does not automatically create better motion design. Motion has to mean something, and it has to leave enough stillness for the meaning to land.

The revised approach is closer to:

Click → focus → zoom → arrive

Stellar pages moved toward a different ratio: about 90% still, 10% animation. The star should look like a strong astronomical image first. Subtle motion — atmosphere, a quiet flare — should be something the viewer discovers after looking, not something that announces itself on entry.

Removing effects was harder than adding them. It also improved the product more than any of the effects I removed.

![Before and after simplifying the star transition](placeholder:starlenz/motion-simplification.png)

## 9. Rethinking Multiple-Star Systems

Binary and multiple-star systems created a similar kind of overload, this time in information design.

Trying to show the primary star, companions, orbit, barycenter, glow layers, and scientific information simultaneously made the page busy before it was informative. Everything was true. Very little was readable.

The current direction separates the experience into levels:

Primary Star Portrait → View System → Show Orbits

The default page stays calm. A portrait. A name. The facts you need to know you are looking at a star. The scientific complexity is still available, but only when the user chooses to go looking for it.

That is progressive disclosure. It is not hiding the work. It is refusing to dump every available piece of information onto someone who just arrived from Orion’s belt.

I still get this wrong in drafts. The instinct, after building a system, is to display the system. The better instinct is to display the subject.

## 10. Designing for Readability

Colorful celestial gradients are hostile to type. That is not a reason to flatten the sky. It is a reason to protect the words.

The readability work has been unglamorous and continuous:

- Stronger text contrast against the atmosphere
- Larger body type than the mockups suggested
- Controlled line length so sentences do not stretch across the monitor
- Localized dark scrims behind important copy
- Avoiding large feature stars directly behind headings
- Reduced gradient brightness in content regions
- Keeping gold for interaction rather than body text

If a paragraph needs a yellow glow to feel “on brand,” the brand is interfering. The background should support the information. When it competes, the information loses, and so does the sense of being in space — because you cannot look at the sky and read at the same time unless one of them yields.

## 11. What I’m Learning

A graphic design mockup is not automatically a usable interface. It is a hypothesis about feeling. Turning it into software means discovering which parts of that feeling survive contact with layout, input, and time.

Responsive design is not just scaling. Composition has to change. Orion in a landscape frame is not the same picture as Orion on a phone, even when the star positions are identical.

Interaction design benefits from restraint. The transitions I am happiest with are the ones with fewer steps.

Reusable data architecture makes visual interfaces easier to expand. Once constellations were data, fitting them to a frame became a presentation problem instead of a redrawing problem. That is a better class of problem.

Animation should reinforce meaning. Travel toward a star. Do not celebrate the fact that CSS can move.

Iteration is normal. Removing an effect can be as important as adding one. I had to build the louder version to see that the quieter one was the product.

I am not pretending this is expert astronomy or finished craft. It is a design and engineering exercise that happens to require both, and I am still learning the astronomy as I go. The honesty of that seems useful to keep in the interface: named stars, structured data, and a clear limit on how much I invent.

## 12. What’s Next

StarLenz is still actively being developed. Current directions — not promises — include:

- Finishing accurate constellation maps
- Adding additional named stars
- Refining stellar detail pages
- Improving binary and multiple-star-system exploration
- Adding deep-sky objects such as nebulae
- Accessibility improvements
- Performance optimization
- Broader mobile testing
- Further scientific-data verification

Some of those will land. Some will change when the next composition problem appears. I would rather keep the list honest than treat it like a roadmap on a marketing site.

## Conclusion

StarLenz started as a visual design exercise. Rebuilding it as a functional experience has turned it into a larger learning project than the mockups implied.

It now combines graphic design, frontend development, responsive layout, animation, astronomy data, information architecture, accessibility, and a long sequence of UI/UX decisions — including the ones that undid previous UI/UX decisions.

Documenting the project matters because the process is the work. A finished constellation viewer would show what I made. This record shows how the thing changed: from a graphic concept to a responsive interface, into an animated celestial environment, then a data-driven map, then a quieter kind of motion, and onward. That sequence is the actual development.
