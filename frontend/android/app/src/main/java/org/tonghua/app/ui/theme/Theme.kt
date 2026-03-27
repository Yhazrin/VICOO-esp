package org.tonghua.app.ui.theme

import android.app.Activity
import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

/**
 * Tonghua Public Welfare Material 3 theme.
 *
 * Light theme uses the warm paper color palette.
 * Dark theme adapts to a dark paper/ink aesthetic.
 */

private val LightColorScheme = lightColorScheme(
    primary = DeepSepia,
    onPrimary = WarmCream,
    primaryContainer = Parchment,
    onPrimaryContainer = InkBlack,
    secondary = BurntSienna,
    onSecondary = WarmCream,
    secondaryContainer = LightSand,
    onSecondaryContainer = CharcoalText,
    tertiary = MutedGold,
    onTertiary = WarmCream,
    tertiaryContainer = Parchment,
    onTertiaryContainer = InkBlack,
    error = ErrorRed,
    onError = Color.White,
    errorContainer = Color(0xFFFFDAD6),
    onErrorContainer = InkBlack,
    background = LinenBackground,
    onBackground = InkBlack,
    surface = PaperWhite,
    onSurface = InkBlack,
    surfaceVariant = Parchment,
    onSurfaceVariant = SlateGray,
    outline = EditorialBorder,
    outlineVariant = EditorialDivider,
    inverseSurface = InkBlack,
    inverseOnSurface = PaperWhite,
    inversePrimary = MutedGold,
)

private val DarkColorScheme = darkColorScheme(
    primary = DarkAccent,
    onPrimary = DarkBackground,
    primaryContainer = DarkSurface,
    onPrimaryContainer = DarkText,
    secondary = Terracotta,
    onSecondary = DarkBackground,
    secondaryContainer = DarkPaper,
    onSecondaryContainer = DarkText,
    tertiary = MutedGold,
    onTertiary = DarkBackground,
    tertiaryContainer = DarkSurface,
    onTertiaryContainer = DarkText,
    error = Color(0xFFFFB4AB),
    onError = Color(0xFF690005),
    errorContainer = Color(0xFF93000A),
    onErrorContainer = Color(0xFFFFDAD6),
    background = DarkBackground,
    onBackground = DarkText,
    surface = DarkSurface,
    onSurface = DarkText,
    surfaceVariant = DarkPaper,
    onSurfaceVariant = DarkMutedText,
    outline = DarkBorder,
    outlineVariant = Color(0xFF3D3A35),
    inverseSurface = DarkText,
    inverseOnSurface = DarkBackground,
    inversePrimary = DeepSepia,
)

@Composable
fun TonghuaTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    dynamicColor: Boolean = false, // Disabled by default to preserve editorial palette
    content: @Composable () -> Unit
) {
    val colorScheme = when {
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            val context = LocalContext.current
            if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
        }
        darkTheme -> DarkColorScheme
        else -> LightColorScheme
    }

    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            val insetsController = WindowCompat.getInsetsController(window, view)
            insetsController.isAppearanceLightStatusBars = !darkTheme
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = TonghuaTypography,
        shapes = TonghuaShapes,
        content = content,
    )
}
