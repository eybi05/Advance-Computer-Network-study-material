"""Read and write Cisco Packet Tracer 5+ files (.pkt, .pka, .ptd).

A file is the network as XML, zlib-compressed behind a 4-byte big-endian length, XOR-obfuscated,
encrypted with Twofish-128 in EAX mode (fixed key and nonce, 16-byte tag at the end) and obfuscated
once more in reverse byte order. Twofish comes from libgcrypt, which every desktop Linux ships.
"""
import base64
import ctypes
import ctypes.util
import zlib

_lib = ctypes.CDLL(ctypes.util.find_library('gcrypt') or 'libgcrypt.so.20')
_lib.gcry_check_version.restype = ctypes.c_char_p
_lib.gcry_check_version(None)
_TWOFISH128, _MODE_EAX = 303, 14
_KEY, _IV = bytes([137]) * 16, bytes([16]) * 16


def _cipher(key=_KEY, iv=_IV):
    hd = ctypes.c_void_p()
    if _lib.gcry_cipher_open(ctypes.byref(hd), _TWOFISH128, _MODE_EAX, 0):
        raise RuntimeError('libgcrypt has no Twofish/EAX')
    _lib.gcry_cipher_setkey(hd, key, 16)
    _lib.gcry_cipher_setiv(hd, iv, 16)
    return hd


def decode(data):
    """Packet Tracer file bytes -> XML bytes."""
    n = len(data)
    x = bytes(data[n - 1 - i] ^ ((n - i * n) & 0xFF) for i in range(n))
    body, tag = x[:-16], x[-16:]
    hd = _cipher()
    buf = ctypes.create_string_buffer(body, len(body))
    _lib.gcry_cipher_decrypt(hd, buf, len(body), None, 0)
    bad_tag = _lib.gcry_cipher_checktag(hd, tag, 16)
    _lib.gcry_cipher_close(hd)
    if bad_tag:
        raise ValueError('not a Packet Tracer 5+ file (authentication tag mismatch)')
    m = len(body)
    out = bytes(b ^ ((m - i) & 0xFF) for i, b in enumerate(buf.raw))
    xml = zlib.decompress(out[4:])
    if len(xml) != int.from_bytes(out[:4], 'big'):
        raise ValueError('length header does not match the XML')
    return xml


def encode(xml):
    """XML bytes -> Packet Tracer file bytes."""
    raw = len(xml).to_bytes(4, 'big') + zlib.compress(xml, 9)
    m = len(raw)
    raw = bytes(b ^ ((m - i) & 0xFF) for i, b in enumerate(raw))
    hd = _cipher()
    buf = ctypes.create_string_buffer(raw, m)
    _lib.gcry_cipher_encrypt(hd, buf, m, None, 0)
    tag = ctypes.create_string_buffer(16)
    _lib.gcry_cipher_gettag(hd, tag, 16)
    _lib.gcry_cipher_close(hd)
    x = buf.raw + tag.raw
    n = len(x)
    out = bytearray(n)
    for i, b in enumerate(x):
        out[n - 1 - i] = b ^ ((n - i * n) & 0xFF)
    return bytes(out)


def decode_log_line(line):
    """One line of a Packet Tracer log (~/pt/logs): base64 of the first two stages above with
    key 0xBA, IV 0xBE and no compression."""
    data = base64.b64decode(line)
    n = len(data)
    x = bytes(data[n - 1 - i] ^ ((n - i * n) & 0xFF) for i in range(n))
    hd = _cipher(bytes([0xBA]) * 16, bytes([0xBE]) * 16)
    buf = ctypes.create_string_buffer(x[:-16], n - 16)
    _lib.gcry_cipher_decrypt(hd, buf, n - 16, None, 0)
    _lib.gcry_cipher_close(hd)
    return buf.raw.decode('utf-8', 'replace')
