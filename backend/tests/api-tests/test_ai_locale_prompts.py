from app.services.ai_assistant.prompts import (
    get_catalog_clarification,
    get_system_prompt,
    resolve_locale,
)


def test_resolve_locale_from_metadata():
    assert resolve_locale({"locale": "zh-CN"}) == "zh"
    assert resolve_locale({"language": "en-US"}) == "en"
    assert resolve_locale({}) == "zh"


def test_system_prompt_language_split():
    zh = get_system_prompt({"locale": "zh"})
    en = get_system_prompt({"locale": "en"})
    assert "简体中文" in zh
    assert "Always respond in English" in en
    assert zh != en


def test_catalog_clarification_single_language():
    assert "Uniqlo" in get_catalog_clarification({"locale": "zh"})
    assert "Sure" in get_catalog_clarification({"locale": "en"})
    assert "\n\nSure" not in get_catalog_clarification({"locale": "zh"})


def test_resolve_locale_from_english_user_message():
    assert resolve_locale({"locale": "zh"}, "Explain traceability flow") == "en"


def test_traceability_blurb_no_supply_chain_path():
    from app.services.ai_assistant.prompts import get_traceability_tool_blurb

    en = get_traceability_tool_blurb(
        "http://localhost:9111/",
        {"locale": "en"},
        "traceability flow",
    )
    assert "impact/shop" in en
    assert "/supply-chain" in en and "no public" in en.lower()
