# Website feature gallery

The components page uses purple visual cards, one benefit per feature, and a
single link to a working example. It no longer presents a connected fictional
business or requires visitors to complete another demo first.

## Content and layout

- `lib/featureGallery.js`: visual type, short benefit, action, and filter group.
- `components/showcase/FeaturePicture.js`: code-native illustrated UI previews,
  with real product, food, and website images. Decorative previews link directly
  to the working examples; they do not imply a completed real transaction.
- `pages/components.js`: five simple filters and the visual gallery. Existing
  technical and business-goal category URLs continue to work.
- `components/showcase/SimpleFeatureDemo.js`: six independent examples. Each
  opens with useful sample content, one primary action, and a reset button.

Booking, estimates, product options, customer approval, inquiry tracking, and
file approval keep their state only while that example is open. They do not
use the former shared Cedar & Coast browser-storage data. Nothing is sent,
booked, uploaded, or charged. Image previews use temporary object URLs and
release them when replaced or closed; PDF previews display filenames only.

Existing store, sales dashboard, live assistant, restaurant, and interactive
design demos remain available. Restaurant UI accents also use the site purple.
The original calendar, timeline, and individual space routes are preserved.
