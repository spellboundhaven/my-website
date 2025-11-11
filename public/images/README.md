# Images Directory

This directory contains all the images for your vacation rental website.

## Directory Structure

```
public/images/
├── hero/           # Hero section background images
├── rooms/          # Room photos
├── amenities/      # Amenity photos
├── reviews/        # Guest photos
└── README.md       # This file
```

## How to Add Your Images

1. **Copy your images** into the appropriate folders
2. **Update the property.ts file** to reference local images
3. **Use the format**: `/images/folder/filename.jpg`

## Example Usage

Instead of:
```typescript
src: "https://images.unsplash.com/photo-1234567890"
```

Use:
```typescript
src: "/images/hero/beach-house.jpg"
```

## Image Optimization Tips

- **Format**: Use WebP or JPEG for photos
- **Size**: Optimize images to be under 1MB each
- **Dimensions**: 
  - Hero images: 1920x1080px or larger
  - Room images: 800x600px
  - Thumbnails: 400x300px

## Tools for Image Optimization

- **Online**: TinyPNG, Squoosh.app
- **Desktop**: ImageOptim (Mac), GIMP
- **Command line**: `brew install imagemagick` then use `convert` command


