from app.utils.masking import mask_name, mask_phone, mask_email

def test_mask_name():
    assert mask_name("John Doe") == "J******e"
    assert mask_name("张三") == "张*"
    assert mask_name("李小龙") == "李*龙"
    assert mask_name("A") == "*"
    assert mask_name("") == ""

def test_mask_phone():
    assert mask_phone("13812345678") == "138****5678"
    assert mask_phone("+8613812345678") == "+86138****5678"
    assert mask_phone("12345") == "*****"
    assert mask_phone("") == ""

def test_mask_email():
    assert mask_email("user@example.com") == "u**r@example.com"
    assert mask_email("a@b.com") == "*@b.com"
    assert mask_email("ab@c.com") == "a*@c.com"
    assert mask_email("abc@d.com") == "a*c@d.com"
    assert mask_email("") == ""
