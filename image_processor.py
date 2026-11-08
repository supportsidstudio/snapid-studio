import io
from rembg import remove, new_session
from PIL import Image, ImageEnhance, ImageFilter

_SESSION = None

def _get_session():
    global _SESSION
    if _SESSION is None:
        _SESSION = new_session("birefnet-general")
    return _SESSION

def remove_background(image_bytes: bytes) -> Image.Image:
    session = _get_session()
    output_bytes = remove(image_bytes, session=session)
    return Image.open(io.BytesIO(output_bytes)).convert("RGBA")

def enhance_image(img: Image.Image) -> Image.Image:
    img = img.filter(ImageFilter.SHARPEN)
    img = ImageEnhance.Brightness(img).enhance(1.05)
    img = ImageEnhance.Contrast(img).enhance(1.05)
    img = ImageEnhance.Color(img).enhance(1.05)
    return img

def process_image(image_bytes: bytes) -> bytes:
    original = Image.open(io.BytesIO(image_bytes))
    if max(original.size) > 2000:
        ratio = 2000 / max(original.size)
        new_size = (int(original.size[0] * ratio), int(original.size[1] * ratio))
        original = original.resize(new_size, Image.LANCZOS)

    buf = io.BytesIO()
    original.save(buf, format="PNG")
    resized_bytes = buf.getvalue()

    img = remove_background(resized_bytes)
    img = enhance_image(img)

    out = io.BytesIO()
    img.save(out, format="PNG")
    return out.getvalue()

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        in_path = sys.argv[1]
        out_path = sys.argv[2] if len(sys.argv) > 2 else "output.png"
        with open(in_path, "rb") as f:
            raw_bytes = f.read()
        processed = process_image(raw_bytes)
        with open(out_path, "wb") as f:
            f.write(processed)
    else:
        input_data = sys.stdin.buffer.read()
        if input_data:
            sys.stdout.buffer.write(process_image(input_data))
