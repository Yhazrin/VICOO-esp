import re
from typing import Optional

def mask_name(name: Optional[str]) -> str:
    """
    Mask a real name.
    Example: 'John Doe' -> 'J**n D*e' or '张三' -> '张*'
    """
    if not name:
        return ""
    
    if len(name) <= 1:
        return "*"
    
    if len(name) == 2:
        return name[0] + "*"
    
    # For longer names, keep first and last char, mask middle
    return name[0] + "*" * (len(name) - 2) + name[-1]

def mask_phone(phone: Optional[str]) -> str:
    """
    Mask a phone number.
    Example: '13812345678' -> '138****5678'
    """
    if not phone:
        return ""
    
    # Remove non-digit characters for processing, but keep '+' if present
    clean_phone = re.sub(r'[^\d+]', '', phone)
    
    # Check for +86 or other international prefixes
    if clean_phone.startswith("+86"):
        prefix = "+86"
        core_phone = clean_phone[3:]
    elif clean_phone.startswith("86") and len(clean_phone) == 13:
        prefix = "86"
        core_phone = clean_phone[2:]
    else:
        prefix = ""
        core_phone = clean_phone

    if len(core_phone) == 11:
        masked_core = core_phone[:3] + "****" + core_phone[7:]
        return prefix + masked_core
    
    if len(core_phone) < 7:
        return prefix + "*" * len(core_phone)
    
    # Generic masking for other lengths: keep first 3 and last 4 if possible
    p_len = min(3, len(core_phone) // 3)
    s_len = min(4, len(core_phone) // 3)
    m_len = len(core_phone) - p_len - s_len
    
    return prefix + core_phone[:p_len] + "*" * m_len + core_phone[-s_len:]

def mask_email(email: Optional[str]) -> str:
    """
    Mask an email address.
    Example: 'user@example.com' -> 'u***r@example.com'
    """
    if not email or "@" not in email:
        return email or ""
    
    user_part, domain_part = email.split("@", 1)
    
    if len(user_part) <= 1:
        masked_user = "*"
    elif len(user_part) == 2:
        masked_user = user_part[0] + "*"
    else:
        # Keep first and last, mask middle
        masked_user = user_part[0] + "*" * (len(user_part) - 2) + user_part[-1]
        
    return f"{masked_user}@{domain_part}"
