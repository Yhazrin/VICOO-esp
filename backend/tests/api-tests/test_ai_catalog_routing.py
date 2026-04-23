from app.services.ai_assistant.service import AIAssistantService


def _service() -> AIAssistantService:
    return AIAssistantService(db=None)  # type: ignore[arg-type]


def test_catalog_scope_prefers_surface_when_no_sustainability_keywords():
    svc = _service()
    scope = svc._determine_catalog_scope(
        last_user="帮我找一个包",
        context="shop",
        metadata={"surface": "uniqlo", "route": "/shop"},
    )
    assert scope == "uniqlo"


def test_catalog_scope_overrides_to_impact_for_sustainability_keywords():
    svc = _service()
    scope = svc._determine_catalog_scope(
        last_user="我想找一个可持续公益包",
        context="shop",
        metadata={"surface": "uniqlo", "route": "/shop"},
    )
    assert scope == "impact"


def test_catalog_scope_uses_impact_route():
    svc = _service()
    scope = svc._determine_catalog_scope(
        last_user="推荐一个包",
        context="general",
        metadata={"route": "/impact/shop", "impactMode": True},
    )
    assert scope == "impact"


def test_build_product_url_uses_surface_path():
    svc = _service()
    impact_url = svc._build_product_url(12, True)
    uniqlo_url = svc._build_product_url(9, False)
    assert "/impact/shop/12" in impact_url
    assert "/shop/9" in uniqlo_url


def test_build_product_url_falls_back_to_vm_domain_for_localhost():
    svc = _service()
    url = svc._build_product_url(3, False)
    assert "http://csi420-02-vm8.ucd.ie/" in url


def test_sanitize_assistant_reply_removes_think_block():
    svc = _service()
    raw = "<think>internal reasoning</think>\n\n好的，我给你推荐几款包。"
    assert svc._sanitize_assistant_reply(raw) == "好的，我给你推荐几款包。"
