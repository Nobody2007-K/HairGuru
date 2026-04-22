# HAIRGURU — Innovation Project Document

---

## Project Title

**HAIRGURU** — AI-Powered 3D Hairstyle Recommendation Platform

---

## Group Members

| S.N. | Name                | Student ID | Role                  |
|------|---------------------|------------|-----------------------|
| 1    | Kashish Shrestha    | 26140480   | Team Lead / Backend Developer/Database  |
| 2    | Roshan Rana Magar   | 26140519   | Documentation/3D modeling               |
| 3    | Aaryan Acharya      | 26140432   | AI/ML                                   |
| 4    | Susan Khanal        | 26140550   | Frontend Developer / UI-UX              |

---

## Problem Statement

Millions of people visit salons every day hoping to get a trendy haircut they saw on social media — only to find out that the hairstyle does not suit their face shape, head structure, or facial features. This mismatch leads to:

- **Dissatisfaction and regret** after spending money on a haircut that looks unflattering.
- **Low self-confidence** caused by an appearance that does not meet the individual's expectations.
- **Financial waste**, as corrective haircuts or treatments are often needed afterward.
- **Communication gap** between the customer and the barber/stylist, since customers cannot accurately visualize how a style will look on them before committing.

Currently, there is no accessible, user-friendly tool that allows a person to preview how a specific hairstyle would look on **their own face and head shape** before visiting the salon. Existing solutions are limited to simple 2D overlays or generic filters that do not account for 3D head geometry, skin tone, or facial proportions.

---

## Proposed Solution

**HAIRGURU** is a web-based platform that uses Artificial Intelligence and 3D modeling to recommend the most suitable hairstyles for any user based on their facial photograph.

### How It Works (User Flow)

1. **Upload a Photo** — The user uploads a clear, front-facing photograph of themselves on the HAIRGURU website.
2. **AI Face Analysis** — The system analyzes the uploaded image to detect:
   - Face shape (oval, round, square, heart, oblong, diamond, etc.)
   - Facial proportions (forehead width, jawline, cheekbones)
   - Head structure and key facial landmarks
3. **3D Head Generation** — Using the analyzed data, HAIRGURU generates a realistic **3D model of the user's head**.
4. **Hairstyle Recommendation** — The AI engine matches the user's face shape and features against a curated database of hairstyles and recommends the **top hairstyles** that would best complement the user's appearance.
5. **3D Preview** — The recommended hairstyles are rendered on the user's 3D head model, allowing them to **rotate and view** the hairstyle from all angles before making a decision.
6. **Save & Share** — Users can save their preferred looks, download preview images, or share them directly with their barber/stylist.

### Technical Architecture (High-Level)

```
User (Browser)
    │
    ▼
┌──────────────┐
│  Frontend    │  ← Html/Css
│  (Web App)   │
└──────┬───────┘
       │ API Calls
       ▼
┌──────────────┐
│  Backend     │  ← Python (Flask / FastAPI)
│  Server      │
└──────┬───────┘
       │
       ├──► Face Detection & Analysis Module (OpenCV, Dlib, MediaPipe)
       │
       ├──► Face Shape Classification Model (CNN / Transfer Learning)
       │
       ├──► 3D Head Reconstruction Module (3DMM / Deep3DFace / PIFuHD)
       │
       ├──► Hairstyle Recommendation Engine (Rule-based + ML matching)
       │
       └──► Hairstyle Database (categorized by face shape compatibility)
```

---

## Innovative Idea

What makes HAIRGURU unique and different from existing solutions:

| Feature                        | Existing Apps (Filters/AR)       | HAIRGURU                                      |
|--------------------------------|----------------------------------|-----------------------------------------------|
| Face shape detection           | Basic or none                    | AI-powered precise classification             |
| 3D head modeling               | Not available                    | Full 3D head reconstruction from a single photo |
| Hairstyle recommendation logic | User manually browses styles     | AI recommends styles based on facial analysis  |
| Multi-angle preview            | Front-facing only (2D overlay)   | 360° rotatable 3D preview                     |
| Personalization                | Generic one-size-fits-all        | Tailored to individual face geometry           |

**Key Innovations:**
1. **Single-Image 3D Reconstruction** — Generating a 3D head model from just one photograph, eliminating the need for expensive 3D scanners.
2. **AI-Driven Compatibility Matching** — Instead of letting the user guess, the system intelligently suggests hairstyles proven to complement specific face shapes.
3. **Accessible to Everyone** — No app installation needed; works directly in the browser on any device.

---

## SDG Goal Alignment

HAIRGURU aligns with the following **United Nations Sustainable Development Goals (SDGs)**:

### SDG 3 — Good Health and Well-Being
- Appearance significantly impacts **mental health and self-esteem**. A bad haircut can cause anxiety, embarrassment, and reduced confidence, especially among young people.
- By helping users choose hairstyles that genuinely suit them, HAIRGURU contributes to improved **psychological well-being** and positive self-image.

### SDG 9 — Industry, Innovation and Infrastructure
- HAIRGURU leverages cutting-edge AI and 3D modeling technologies to innovate within the grooming and personal care industry.
- It introduces a **technology-driven solution** to a traditionally analog problem (choosing a haircut), promoting digital innovation.

### SDG 12 — Responsible Consumption and Production
- Bad haircuts lead to **wasteful consumption** — additional salon visits, corrective treatments, and unnecessary product usage.
- By enabling informed decisions before visiting the salon, HAIRGURU reduces waste and promotes **responsible consumption** in the personal grooming sector.

---

## Minimum Viable Product (MVP) Features

The MVP will focus on delivering a functional **3D Haircut Recommender** with the following core features:

| # | MVP Feature                       | Description                                                    |
|---|-----------------------------------|----------------------------------------------------------------|
| 1 | Photo Upload                      | User uploads a clear front-facing photo via the web interface  |
| 2 | Face Shape Detection              | AI analyzes the photo to classify the user's face shape        |
| 3 | 3D Head Model Generation          | Generate a basic 3D head model from the uploaded photograph    |
| 4 | Hairstyle Recommendation          | Display top 3–5 recommended hairstyles based on face shape     |
| 5 | 3D Hairstyle Preview              | Render recommended hairstyles on the 3D head model             |
| 6 | Responsive Web Interface          | Clean, mobile-friendly website accessible from any device      |

---

## Future Additions / Enhancements

After the MVP stage, the following features are planned:

1. **Hair Color Simulation** — Allow users to preview different hair colors on their 3D model.
2. **Beard & Facial Hair Recommendations** — Extend the system to recommend beard and mustache styles.
3. **AR (Augmented Reality) Live Preview** — Real-time hairstyle overlay using the device camera.
4. **Salon Integration** — Partner with local salons so users can book appointments directly with their chosen style.
5. **User Accounts & History** — Save past recommendations and track style preferences over time.
6. **Social Sharing** — Share 3D previews on social media platforms.
7. **Stylist Dashboard** — A portal for professional stylists to view client preferences before appointments.
8. **Multi-Language Support** — Expand to support Nepali, Hindi, and other regional languages.
9. **Skin Tone & Texture Analysis** — Incorporate skin tone matching for more holistic grooming recommendations.
10. **Community & Reviews** — Allow users to rate and review hairstyles, building a community-driven database.

---

## Target Audience

| Audience Segment             | Description                                                                 |
|------------------------------|-----------------------------------------------------------------------------|
| **General Public**           | Anyone looking for a new hairstyle who wants to preview it before committing |
| **Young Adults (18–35)**     | Social media-influenced individuals who frequently experiment with hairstyles |
| **Salon Customers**          | People visiting barbers/salons who want better communication with stylists   |
| **Barbers & Stylists**       | Professionals who can use the tool to understand client expectations          |
| **Fashion-Conscious Users**  | Individuals who value personal grooming and want data-driven style advice     |

---

## Technology / Tools Used

| Category               | Technology / Tool                                      |
|------------------------|--------------------------------------------------------|
| **Frontend**           | React.js / Next.js, HTML5, CSS3, JavaScript            |
| **Backend**            | Python (Flask or FastAPI)                               |
| **AI / ML**            | TensorFlow / PyTorch, OpenCV, Dlib, MediaPipe          |
| **3D Modeling**        | Three.js (web rendering), 3D Morphable Models (3DMM), PIFuHD |
| **Face Analysis**      | CNN-based face shape classifier (custom trained)       |
| **Database**           | PostgreSQL / MongoDB                                   |
| **Cloud / Hosting**    | AWS / Google Cloud / Vercel                            |
| **Version Control**    | Git & GitHub                                           |
| **Design / Prototyping** | Figma                                                |
| **Project Management** | Trello / Notion                                        |

---

## Project Timeline / Milestones

| Phase   | Timeline        | Milestone                                                |
|---------|-----------------|----------------------------------------------------------|
| Phase 1 | Week 1–2        | Research & requirement gathering; finalize tech stack     |
| Phase 2 | Week 3–4        | Dataset collection (face images, hairstyle catalog)      |
| Phase 3 | Week 5–7        | Train face shape classification model                    |
| Phase 4 | Week 6–8        | Develop 3D head reconstruction pipeline                  |
| Phase 5 | Week 8–10       | Build recommendation engine and hairstyle database       |
| Phase 6 | Week 9–11       | Frontend development and API integration                 |
| Phase 7 | Week 12         | Testing, bug fixing, and optimization                    |
| Phase 8 | Week 13–14      | MVP demo, presentation, and documentation                |

---

## Potential Challenges

| Challenge                                  | Mitigation Strategy                                                       |
|--------------------------------------------|---------------------------------------------------------------------------|
| **Accuracy of 3D reconstruction from a single photo** | Use pre-trained models (e.g., 3DMM, DECA) and fine-tune on diverse datasets |
| **Face shape classification accuracy**     | Collect diverse training data across ethnicities; use transfer learning    |
| **Limited computational resources**        | Use cloud-based GPU instances (Google Colab, AWS) for model training       |
| **Hairstyle database creation**            | Start with a curated set of 50–100 popular hairstyles; expand iteratively  |
| **Real-time 3D rendering in browser**      | Optimize Three.js rendering; use Level of Detail (LOD) techniques          |
| **Privacy and data security**              | Process images server-side with encryption; do not store photos permanently |
| **Team skill gaps in AI/3D**               | Leverage online courses, tutorials, and open-source pre-trained models     |

---

## Market Research

### Industry Overview
- The global hair care market was valued at over **$87 billion in 2023** and is projected to grow at a CAGR of 5.5% through 2030.
- The virtual try-on market (AR/AI-based) is rapidly expanding, with companies like L'Oréal, ModiFace, and YouCam already investing in AI beauty tools.

### Competitor Analysis

| Competitor       | What They Offer                    | HAIRGURU's Advantage                         |
|------------------|------------------------------------|----------------------------------------------|
| YouCam Makeup    | 2D AR hairstyle try-on             | HAIRGURU offers full 3D modeling, not just overlay |
| ModiFace (L'Oréal) | Color and makeup try-on          | HAIRGURU focuses specifically on hairstyle fit based on face shape |
| FaceApp          | AI-based style filters             | HAIRGURU provides personalized recommendations, not generic filters |
| Hair Zapp        | Basic face shape quiz + suggestions | HAIRGURU uses AI for precise face analysis, not manual quizzes |

### Gap in the Market
No existing platform combines **AI face shape analysis + 3D head reconstruction + personalized hairstyle recommendation** into a single, free, web-based tool. HAIRGURU fills this gap.

---

## Visual Representation

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        USER (Browser)                       │
│                                                             │
│   ┌──────────┐    ┌──────────────┐    ┌──────────────────┐  │
│   │  Upload   │───►│  View 3D     │───►│  Save / Share    │  │
│   │  Photo    │    │  Preview     │    │  Results         │  │
│   └──────────┘    └──────────────┘    └──────────────────┘  │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTPS
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      BACKEND SERVER                         │
│                                                             │
│   ┌──────────────┐   ┌──────────────┐   ┌───────────────┐  │
│   │ Face Shape   │   │ 3D Head      │   │ Hairstyle     │  │
│   │ Classifier   │   │ Generator    │   │ Recommender   │  │
│   │ (CNN Model)  │   │ (3DMM/DECA)  │   │ (ML Engine)   │  │
│   └──────────────┘   └──────────────┘   └───────────────┘  │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐   │
│   │            Hairstyle Database (50–100+ styles)      │   │
│   └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### User Flow Diagram

```
Start
  │
  ▼
User visits HAIRGURU website
  │
  ▼
User uploads a front-facing photo
  │
  ▼
AI detects face landmarks & classifies face shape
  │
  ▼
System generates 3D head model
  │
  ▼
Recommendation engine selects best hairstyles
  │
  ▼
3D hairstyles rendered on user's head model
  │
  ▼
User previews, rotates, and explores styles
  │
  ▼
User saves or shares preferred hairstyle
  │
  ▼
End
```

---

## Conclusion

HAIRGURU addresses a real, everyday problem faced by millions of people — choosing the right hairstyle. By combining AI-powered face analysis with 3D head reconstruction, our platform empowers users to make confident, informed grooming decisions before ever stepping into a salon. The project is technically innovative, socially impactful (aligned with SDG 3, 9, and 12), and commercially viable in the growing virtual try-on market.

---

*Document prepared by Team HAIRGURU — 2nd Semester Innovation Project*
*Date: April 12, 2026*
