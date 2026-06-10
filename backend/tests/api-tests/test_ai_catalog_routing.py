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


def test_build_product_url_falls_back_to_localhost_for_dev():
    svc = _service()
    url = svc._build_product_url(3, False)
    assert "http://localhost:9111/" in url


def test_sanitize_assistant_reply_removes_think_block():
    svc = _service()
    raw = "<think>internal reasoning</think>\n\n好的，我给你推荐几款包。"
    assert svc._sanitize_assistant_reply(raw) == "好的，我给你推荐几款包。"


def test_should_ask_catalog_clarification_for_ambiguous_product_intent():
    svc = _service()
    assert svc._should_ask_catalog_clarification("帮我推荐一款衣物")


def test_should_not_ask_catalog_clarification_when_catalog_is_specified():
    svc = _service()
    assert not svc._should_ask_catalog_clarification("帮我推荐一款 Uniqlo 的包")
    assert not svc._should_ask_catalog_clarification("给我推荐一款 Impact 公益包")


def test_extract_search_terms_expands_tshirt_synonyms():
    svc = _service()
    terms = svc._extract_search_terms("I want a T-shirt", limit=6)
    assert "tshirt" in terms
    assert "t恤" in terms
