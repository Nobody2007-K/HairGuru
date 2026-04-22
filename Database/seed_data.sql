-- ============================================================
-- HAIRGURU Seed Data
-- Based on the STYLE_LIBRARY from faceshape_detection.ipynb
-- ============================================================

-- ============================================================
-- Face Shapes
-- ============================================================
INSERT INTO face_shapes (name, description, note) VALUES
('Heart',
 'Wider forehead and cheekbones, narrowing down to a pointed chin.',
 'Soften wide forehead; keep top balanced.'),

('Oblong',
 'Longer than it is wide with a relatively uniform width from forehead to jaw.',
 'Reduce face length; avoid excess height.'),

('Oval',
 'Balanced proportions — slightly wider at the cheekbones, gently narrowing at forehead and jaw.',
 'Balanced face — most styles work, avoid extremes.'),

('Round',
 'Similar width and length with soft, curved features and full cheeks.',
 'Add height and angles to reduce roundness.'),

('Square',
 'Strong, angular jawline with forehead and jaw approximately the same width.',
 'Strong jaw works best with texture and clean structure.');

-- ============================================================
-- Hairstyles  (recommended + avoid combined)
-- ============================================================
INSERT INTO hairstyles (name, description, gender, length_category) VALUES
-- Round recommended
('High fade + textured top',
 'Short sides fading up with textured, voluminous top to elongate the face.',
 'male', 'short'),
('Short quiff (controlled height)',
 'A short, structured quiff that adds height without excess width.',
 'male', 'short'),
('Side part with volume',
 'Classic side part styled with lift at the roots for vertical emphasis.',
 'male', 'medium'),

-- Round avoid
('Heavy straight fringe',
 'A thick, blunt fringe that cuts across the forehead, shortening the face visually.',
 'unisex', 'medium'),
('Bowl / very rounded cuts',
 'Rounded silhouette that emphasizes the circular shape of the face.',
 'unisex', 'short'),

-- Square recommended
('Crew cut / Ivy League',
 'Timeless short cut with slightly longer top of neatly combed to one side.',
 'male', 'short'),
('Textured crop + mid fade',
 'Choppy textured top paired with a mid fade for a modern, balanced look.',
 'male', 'short'),
('Side part taper',
 'Sharp side part with a gradual taper on the sides for refined structure.',
 'male', 'short'),

-- Square avoid
('Ultra boxy flat-top',
 'Very angular flat-top that over-emphasizes the squareness of the jaw.',
 'male', 'short'),

-- Oblong recommended
('Textured fringe (light)',
 'Light, wispy fringe that covers part of the forehead to reduce face length.',
 'unisex', 'medium'),
('Curtains / medium layered cut',
 'Center-parted curtain bangs with medium-length layers for width.',
 'unisex', 'medium'),
('Low taper + natural top',
 'Subtle low taper with natural, relaxed styling on top.',
 'male', 'medium'),

-- Oblong avoid
('High pompadour',
 'Tall, swept-back pompadour that adds significant height.',
 'male', 'medium'),
('Very tall top with high fade',
 'Extreme vertical top combined with a high fade, exaggerating face length.',
 'male', 'short'),

-- Heart recommended
('Side-swept fringe',
 'Angled fringe swept to one side, softening a wide forehead.',
 'unisex', 'medium'),
('Textured crop (medium height)',
 'Medium-height crop with choppy texture for a relaxed finish.',
 'male', 'medium'),
('Low taper + layered top',
 'Low taper on the sides with soft layering on top for balance.',
 'male', 'medium'),

-- Heart avoid
('Tight sides with huge top volume',
 'Very short sides paired with oversized volume on top, drawing attention to the forehead.',
 'male', 'short'),

-- Oval recommended
('Textured crop',
 'Versatile textured crop that works well with balanced facial proportions.',
 'male', 'short'),
('Side part (moderate volume)',
 'Moderate-volume side part — clean and adaptable.',
 'male', 'medium'),
('Curtains',
 'Classic curtain bangs, center-parted, framing the face symmetrically.',
 'unisex', 'medium'),

-- Oval avoid
('Extreme height styles',
 'Styles with extreme vertical height that can disrupt the face''s natural balance.',
 'unisex', 'medium');

-- ============================================================
-- Recommendations  (face_shape → hairstyle)
-- ============================================================
INSERT INTO face_shape_recommendations (face_shape_id, hairstyle_id, score)
SELECT fs.id, h.id, 1.00
FROM face_shapes fs, hairstyles h
WHERE (fs.name = 'Round'   AND h.name = 'High fade + textured top')
   OR (fs.name = 'Round'   AND h.name = 'Short quiff (controlled height)')
   OR (fs.name = 'Round'   AND h.name = 'Side part with volume')

   OR (fs.name = 'Square'  AND h.name = 'Crew cut / Ivy League')
   OR (fs.name = 'Square'  AND h.name = 'Textured crop + mid fade')
   OR (fs.name = 'Square'  AND h.name = 'Side part taper')

   OR (fs.name = 'Oblong'  AND h.name = 'Textured fringe (light)')
   OR (fs.name = 'Oblong'  AND h.name = 'Curtains / medium layered cut')
   OR (fs.name = 'Oblong'  AND h.name = 'Low taper + natural top')

   OR (fs.name = 'Heart'   AND h.name = 'Side-swept fringe')
   OR (fs.name = 'Heart'   AND h.name = 'Textured crop (medium height)')
   OR (fs.name = 'Heart'   AND h.name = 'Low taper + layered top')

   OR (fs.name = 'Oval'    AND h.name = 'Textured crop')
   OR (fs.name = 'Oval'    AND h.name = 'Side part (moderate volume)')
   OR (fs.name = 'Oval'    AND h.name = 'Curtains');

-- ============================================================
-- Avoid  (face_shape → hairstyle to avoid)
-- ============================================================
INSERT INTO face_shape_avoid (face_shape_id, hairstyle_id, reason)
SELECT fs.id, h.id,
    CASE
        WHEN fs.name = 'Round' AND h.name = 'Heavy straight fringe'
            THEN 'Widens the face and shortens it visually.'
        WHEN fs.name = 'Round' AND h.name = 'Bowl / very rounded cuts'
            THEN 'Emphasizes circular shape of the face.'
        WHEN fs.name = 'Square' AND h.name = 'Ultra boxy flat-top'
            THEN 'Over-emphasizes the squareness of the jaw.'
        WHEN fs.name = 'Oblong' AND h.name = 'High pompadour'
            THEN 'Adds too much height, elongating the face further.'
        WHEN fs.name = 'Oblong' AND h.name = 'Very tall top with high fade'
            THEN 'Extreme vertical emphasis exaggerates face length.'
        WHEN fs.name = 'Heart' AND h.name = 'Tight sides with huge top volume'
            THEN 'Draws attention to the wide forehead.'
        WHEN fs.name = 'Oval' AND h.name = 'Extreme height styles'
            THEN 'Disrupts the face''s natural balance.'
    END
FROM face_shapes fs, hairstyles h
WHERE (fs.name = 'Round'   AND h.name IN ('Heavy straight fringe', 'Bowl / very rounded cuts'))
   OR (fs.name = 'Square'  AND h.name = 'Ultra boxy flat-top')
   OR (fs.name = 'Oblong'  AND h.name IN ('High pompadour', 'Very tall top with high fade'))
   OR (fs.name = 'Heart'   AND h.name = 'Tight sides with huge top volume')
   OR (fs.name = 'Oval'    AND h.name = 'Extreme height styles');
