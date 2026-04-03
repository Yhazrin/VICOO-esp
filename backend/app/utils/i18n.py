import json
import os
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger("vicoo.i18n")

DEFAULT_LOCALE = "en"
LOCALES_DIR = os.environ.get("LOCALES_DIR") or os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "locales"
)

class I18nManager:
    _translations: Dict[str, Dict[str, Any]] = {}
    _loaded = False

    @classmethod
    def load_translations(cls):
        """Load all JSON files from the locales directory into memory."""
        if not os.path.exists(LOCALES_DIR):
            logger.warning(f"Locales directory not found at {LOCALES_DIR}")
            return
        
        for filename in os.listdir(LOCALES_DIR):
            if filename.endswith(".json"):
                locale = filename[:-5]
                try:
                    with open(os.path.join(LOCALES_DIR, filename), "r", encoding="utf-8") as f:
                        cls._translations[locale] = json.load(f)
                        logger.debug(f"Loaded translations for: {locale}")
                except Exception as e:
                    logger.error(f"Failed to load translations for {locale}: {e}")
        cls._loaded = True

    @classmethod
    def get(cls, key: str, locale: str = DEFAULT_LOCALE, **kwargs) -> str:
        """
        Retrieve a localized string by key (e.g., 'errors.not_found').
        Supports simple placeholder replacement using .format(**kwargs).
        """
        if not cls._loaded:
            cls.load_translations()
        
        parts = key.split(".")
        # Default to requested locale, fallback to DEFAULT_LOCALE, then empty dict
        data = cls._translations.get(locale, cls._translations.get(DEFAULT_LOCALE, {}))
        
        current = data
        for part in parts:
            if isinstance(current, dict) and part in current:
                current = current[part]
            else:
                logger.warning(f"Translation key '{key}' not found for locale '{locale}'")
                return key
        
        if isinstance(current, str):
            try:
                return current.format(**kwargs)
            except KeyError as e:
                logger.warning(f"Missing placeholder {e} for translation key '{key}'")
                return current
        return str(current)

# Convenience function for translations
t = I18nManager.get
