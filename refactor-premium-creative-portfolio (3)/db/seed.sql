-- ===================================================================
-- REFERENCE SEED
-- The application seeds itself idempotently on first run
-- (src/lib/bootstrap.ts) so content, categories, skills, services,
-- carousel rows, CMS settings and the first admin all exist.
-- This file documents the equivalent baseline rows and can be used to
-- restore a fresh database manually.
-- ===================================================================

INSERT INTO categories (name, slug, description, sort_order) VALUES
  ('Real Estate', 'real-estate', 'Property walk-throughs, listing films and cinematic tours.', 0),
  ('Instagram', 'instagram', 'Reels, vertical edits and scroll-stopping social cuts.', 1),
  ('YouTube', 'youtube', 'Long-form edits, retention pacing and thumbnail systems.', 2),
  ('Motion Graphics', 'motion-graphics', 'Kinetic type, animated branding and title systems.', 3),
  ('Graphic Design', 'graphic-design', 'Static design systems, thumbnails and brand layouts.', 4),
  ('Product Video', 'product-video', 'Product storytelling, feature demos and launch edits.', 5),
  ('AI Video', 'ai-video', 'AI-assisted generation, upscaling and hybrid workflows.', 6),
  ('Corporate', 'corporate', 'Brand films, internal communication and event recaps.', 7),
  ('Other', 'other', 'Experiments, personal cuts and everything in between.', 8)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO work_options (label, value, sort_order) VALUES
  ('Video Editing', 'video-editing', 0),
  ('Reels', 'reels', 1),
  ('YouTube', 'youtube', 2),
  ('Real Estate', 'real-estate', 3),
  ('Motion Graphics', 'motion-graphics', 4),
  ('Graphic Design', 'graphic-design', 5),
  ('Product Video', 'product-video', 6),
  ('AI Video', 'ai-video', 7),
  ('AI UGC', 'ai-ugc', 8),
  ('Corporate', 'corporate', 9),
  ('Other', 'other', 10)
ON CONFLICT (value) DO NOTHING;

INSERT INTO skills (name, category, description, level, sort_order) VALUES
  ('Video Editing', 'Post Production', 'Narrative structure, pacing and rhythm across long and short form.', 95, 0),
  ('Motion Graphics', 'Motion', 'Kinetic typography, animated logos, lower thirds and title systems.', 90, 1),
  ('After Effects', 'Tools', 'Compositing, keyframing, expressions and plugin-driven workflows.', 92, 2),
  ('Premiere Pro', 'Tools', 'Timeline-led editing, multicam, proxies and delivery pipelines.', 95, 3),
  ('DaVinci Resolve', 'Tools', 'Node-based colour work, conform and finishing.', 88, 4),
  ('Color Grading', 'Craft', 'Look development, shot matching and cinematic tone shaping.', 90, 5),
  ('AI Video', 'Craft', 'AI-assisted generation, cleanup, upscale and hybrid edit workflows.', 85, 6),
  ('Sound Design', 'Craft', 'Music selection, SFX layering, dialogue cleanup and final mix.', 80, 7),
  ('Social Media Editing', 'Distribution', 'Hook-first cuts, captions, aspect ratio versions and platform specs.', 95, 8),
  ('Creative Direction', 'Strategy', 'References, storyboards, edit styles and visual systems.', 88, 9);

INSERT INTO services (title, description, deliverables, icon, sort_order) VALUES
  ('Video Editing', 'Timeline-led editing for brands, creators and studios.', 'Story assembly|Rhythm & pacing|Subtitles|Multi-ratio delivery', 'cut', 0),
  ('Motion Graphics', 'Animated typography, logo motion and graphic systems.', 'Kinetic type|Logo animation|Titles & LTH|Transitions', 'shape', 1),
  ('Graphic Design', 'Thumbnails, key art and brand layouts.', 'Thumbnails|Key art|Brand layouts|Campaign sets', 'frame', 2),
  ('AI Video', 'AI-assisted generation and hybrid edit workflows.', 'AI generation|Cleanup & upscale|Hybrid edits', 'spark', 3),
  ('Colour Grading', 'Look development and shot matching.', 'Primary & secondary|Shot matching|Look dev|Export masters', 'dial', 4),
  ('Social Media Editing', 'Hook-first vertical edits for retention.', 'Reels & shorts|Hook design|Captions|Batch delivery', 'phone', 5);

INSERT INTO layout_sections (section_key, label, sort_order) VALUES
  ('hero', 'Hero', 0),
  ('about', 'About', 1),
  ('services', 'Services', 2),
  ('work', 'Work / Portfolio', 4),
  ('contact', 'Contact & Enquiry', 5)
ON CONFLICT (section_key) DO NOTHING;

-- Homepage / contact / theme singletons
INSERT INTO homepage_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
INSERT INTO contact_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
INSERT INTO theme_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- One carousel configuration per category (including a global row)
INSERT INTO carousel_settings (category_id, slots, auto_fill, sort_order)
SELECT id, 5, true, sort_order FROM categories
ON CONFLICT DO NOTHING;

-- The first admin account is created by the application (hashed with
-- scrypt) so no plaintext or sample hash is stored here.

INSERT INTO software_tools (name, category, icon, proficiency, sort_order)
SELECT * FROM (VALUES
  ('Adobe Premiere Pro', 'Editing', 'premiere', 95, 0),
  ('Adobe After Effects', 'Motion', 'after-effects', 92, 1),
  ('DaVinci Resolve', 'Colour', 'davinci', 88, 2),
  ('Photoshop', 'Design', 'photoshop', 90, 3),
  ('Illustrator', 'Vector', 'illustrator', 86, 4),
  ('Blender', '3D / Visual Design', 'blender', 78, 5),
  ('CapCut', 'Social Editing', 'capcut', 88, 6),
  ('Figma', 'Design Systems', 'figma', 82, 7),
  ('AI / Generative AI tools', 'AI Video', 'ai', 85, 8)
) AS seed(name, category, icon, proficiency, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM software_tools);
