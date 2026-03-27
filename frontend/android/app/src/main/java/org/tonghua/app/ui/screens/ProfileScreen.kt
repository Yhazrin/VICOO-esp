package org.tonghua.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import org.tonghua.app.viewmodel.AuthViewModel

/**
 * Profile screen showing user info or login prompt.
 */
@Composable
fun ProfileScreen(
    onLoginClick: () -> Unit,
    onMyDonationsClick: () -> Unit,
    onMyOrdersClick: () -> Unit,
    onMyArtworksClick: () -> Unit,
    onSettingsClick: () -> Unit,
    viewModel: AuthViewModel = hiltViewModel(),
) {
    val uiState by viewModel.uiState.collectAsState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .background(MaterialTheme.colorScheme.background)
            .padding(16.dp)
    ) {
        // Header
        Text(
            text = "05",
            style = MaterialTheme.typography.labelLarge,
            color = MaterialTheme.colorScheme.primary,
        )
        Text(
            text = "Profile",
            style = MaterialTheme.typography.displaySmall,
            color = MaterialTheme.colorScheme.onBackground,
        )

        Spacer(modifier = Modifier.height(24.dp))

        if (uiState.isLoggedIn) {
            val user = uiState.user
            if (user != null) {
                LoggedInContent(
                    displayName = user.displayName,
                    role = user.role,
                    onLogout = viewModel::logout,
                    onMyDonationsClick = onMyDonationsClick,
                    onMyOrdersClick = onMyOrdersClick,
                    onMyArtworksClick = onMyArtworksClick,
                    onSettingsClick = onSettingsClick,
                )
            }
        } else {
            // Not logged in
            LoginPrompt(onLoginClick = onLoginClick)
        }
    }
}

@Composable
private fun LoggedInContent(
    displayName: String,
    role: String,
    onLogout: () -> Unit,
    onMyDonationsClick: () -> Unit,
    onMyOrdersClick: () -> Unit,
    onMyArtworksClick: () -> Unit,
    onSettingsClick: () -> Unit,
) {
    // User info card
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
    ) {
        Column(modifier = Modifier.padding(20.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Surface(
                    shape = MaterialTheme.shapes.extraLarge,
                    color = MaterialTheme.colorScheme.primaryContainer,
                    modifier = Modifier.size(56.dp),
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Text(
                            text = displayName.first().uppercase(),
                            style = MaterialTheme.typography.headlineMedium,
                            color = MaterialTheme.colorScheme.onPrimaryContainer,
                        )
                    }
                }
                Spacer(modifier = Modifier.width(16.dp))
                Column {
                    Text(
                        text = displayName,
                        style = MaterialTheme.typography.titleLarge,
                    )
                    Text(
                        text = role.replace("_", " ").uppercase(),
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.primary,
                    )
                }
            }
        }
    }

    Spacer(modifier = Modifier.height(24.dp))

    // Menu items with navigation callbacks
    val menuItems = listOf(
        Triple(Icons.Outlined.FavoriteBorder, "My Donations", onMyDonationsClick),
        Triple(Icons.Outlined.ShoppingBag, "My Orders", onMyOrdersClick),
        Triple(Icons.Outlined.Palette, "My Artworks", onMyArtworksClick),
        Triple(Icons.Outlined.Settings, "Settings", onSettingsClick),
    )

    menuItems.forEach { (icon, title, onClick) ->
        ListItem(
            headlineContent = {
                Text(text = title, style = MaterialTheme.typography.titleSmall)
            },
            supportingContent = {
                Text(text = "Tap to view", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            },
            leadingContent = {
                Icon(icon, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
            },
            modifier = Modifier.clickable { onClick() },
        )
        Divider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f))
    }

    Spacer(modifier = Modifier.height(24.dp))

    // Logout button
    OutlinedButton(
        onClick = onLogout,
        modifier = Modifier.fillMaxWidth(),
        colors = ButtonDefaults.outlinedButtonColors(contentColor = MaterialTheme.colorScheme.error),
    ) {
        Icon(Icons.Filled.Logout, contentDescription = null, modifier = Modifier.size(18.dp))
        Spacer(modifier = Modifier.width(8.dp))
        Text("Logout")
    }
}

@Composable
private fun LoginPrompt(onLoginClick: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
    ) {
        Column(
            modifier = Modifier
                .padding(32.dp)
                .fillMaxWidth(),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Icon(
                Icons.Outlined.Person,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.primary,
                modifier = Modifier.size(64.dp),
            )
            Spacer(modifier = Modifier.height(16.dp))
            Text(
                text = "Welcome",
                style = MaterialTheme.typography.headlineMedium,
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "Sign in to participate in campaigns, vote for artworks, and track your contributions.",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Spacer(modifier = Modifier.height(24.dp))
            Button(
                onClick = onLoginClick,
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
            ) {
                Text("Sign In")
            }
        }
    }
}
