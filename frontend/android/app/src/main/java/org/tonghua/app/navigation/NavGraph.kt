package org.tonghua.app.navigation

import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.stringResource
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.*
import androidx.navigation.navArgument
import org.tonghua.app.ui.screens.*

/**
 * Navigation route constants.
 */
object Routes {
    const val HOME = "home"
    const val CAMPAIGNS = "campaigns"
    const val SHOP = "shop"
    const val DONATE = "donate"
    const val PROFILE = "profile"
    const val LOGIN = "login"
    const val ARTWORK_DETAIL = "artwork/{artworkId}"
    const val PRODUCT_DETAIL = "product/{productId}"
    const val ORDER = "order/{productId}"
    const val CAMPAIGN_DETAIL = "campaign/{campaignId}"
    const val TRACEABILITY = "traceability/{productId}"

    // Profile menu routes
    const val MY_DONATIONS = "my-donations"
    const val MY_ORDERS = "my-orders"
    const val MY_ARTWORKS = "my-artworks"
    const val SETTINGS = "settings"

    fun artworkDetail(artworkId: String) = "artwork/$artworkId"
    fun campaignDetail(campaignId: String) = "campaign/$campaignId"
    fun productDetail(productId: String) = "product/$productId"
    fun order(productId: String) = "order/$productId"
    fun traceability(productId: String) = "traceability/$productId"
}

/**
 * Bottom navigation item definition.
 */
data class BottomNavItem(
    val route: String,
    val labelRes: Int,
    val selectedIcon: ImageVector,
    val unselectedIcon: ImageVector,
)

val bottomNavItems = listOf(
    BottomNavItem(Routes.HOME, org.tonghua.app.R.string.nav_home, Icons.Filled.Home, Icons.Outlined.Home),
    BottomNavItem(Routes.CAMPAIGNS, org.tonghua.app.R.string.nav_campaigns, Icons.Filled.Palette, Icons.Outlined.Palette),
    BottomNavItem(Routes.SHOP, org.tonghua.app.R.string.nav_shop, Icons.Filled.ShoppingBag, Icons.Outlined.ShoppingBag),
    BottomNavItem(Routes.DONATE, org.tonghua.app.R.string.nav_donate, Icons.Filled.Favorite, Icons.Outlined.FavoriteBorder),
    BottomNavItem(Routes.PROFILE, org.tonghua.app.R.string.nav_profile, Icons.Filled.Person, Icons.Outlined.Person),
)

/**
 * Root navigation graph with bottom navigation bar.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TonghuaNavGraph() {
    val navController = rememberNavController()
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentDestination = navBackStackEntry?.destination

    // Determine if bottom bar should be shown
    val showBottomBar = bottomNavItems.any { it.route == currentDestination?.route }

    Scaffold(
        bottomBar = {
            if (showBottomBar) {
                NavigationBar {
                    bottomNavItems.forEach { item ->
                        val selected = currentDestination?.hierarchy?.any { it.route == item.route } == true
                        NavigationBarItem(
                            icon = {
                                Icon(
                                    imageVector = if (selected) item.selectedIcon else item.unselectedIcon,
                                    contentDescription = null,
                                )
                            },
                            label = { Text(stringResource(item.labelRes)) },
                            selected = selected,
                            onClick = {
                                navController.navigate(item.route) {
                                    popUpTo(navController.graph.findStartDestination().id) {
                                        saveState = true
                                    }
                                    launchSingleTop = true
                                    restoreState = true
                                }
                            },
                        )
                    }
                }
            }
        }
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = Routes.HOME,
            modifier = Modifier.padding(innerPadding),
        ) {
            composable(Routes.HOME) {
                HomeScreen(
                    onArtworkClick = { id -> navController.navigate(Routes.artworkDetail(id)) },
                    onCampaignClick = { id -> navController.navigate(Routes.campaignDetail(id)) },
                )
            }
            composable(Routes.CAMPAIGNS) {
                CampaignsScreen(
                    onCampaignClick = { id -> navController.navigate(Routes.campaignDetail(id)) },
                )
            }
            composable(Routes.SHOP) {
                ShopScreen(
                    onProductClick = { id -> navController.navigate(Routes.productDetail(id)) },
                )
            }
            composable(Routes.DONATE) {
                DonateScreen()
            }
            composable(Routes.PROFILE) {
                ProfileScreen(
                    onLoginClick = { navController.navigate(Routes.LOGIN) },
                    onMyDonationsClick = { navController.navigate(Routes.MY_DONATIONS) },
                    onMyOrdersClick = { navController.navigate(Routes.MY_ORDERS) },
                    onMyArtworksClick = { navController.navigate(Routes.MY_ARTWORKS) },
                    onSettingsClick = { navController.navigate(Routes.SETTINGS) },
                )
            }
            composable(Routes.MY_DONATIONS) {
                MyDonationsScreen(
                    onBack = { navController.popBackStack() },
                )
            }
            composable(Routes.MY_ORDERS) {
                MyOrdersScreen(
                    onBack = { navController.popBackStack() },
                )
            }
            composable(Routes.MY_ARTWORKS) {
                MyArtworksScreen(
                    onBack = { navController.popBackStack() },
                )
            }
            composable(Routes.SETTINGS) {
                SettingsScreen(
                    onBack = { navController.popBackStack() },
                )
            }
            composable(Routes.LOGIN) {
                LoginScreen(
                    onLoginSuccess = {
                        navController.navigate(Routes.HOME) {
                            popUpTo(Routes.LOGIN) { inclusive = true }
                        }
                    },
                    onBack = { navController.popBackStack() },
                )
            }
            composable(
                route = Routes.ARTWORK_DETAIL,
                arguments = listOf(navArgument("artworkId") { type = NavType.StringType }),
            ) { backStackEntry ->
                val artworkId = backStackEntry.arguments?.getString("artworkId") ?: return@composable
                ArtworkDetailScreen(
                    artworkId = artworkId,
                    onBack = { navController.popBackStack() },
                )
            }
            composable(
                route = Routes.PRODUCT_DETAIL,
                arguments = listOf(navArgument("productId") { type = NavType.StringType }),
            ) { backStackEntry ->
                val productId = backStackEntry.arguments?.getString("productId") ?: return@composable
                ProductDetailScreen(
                    productId = productId,
                    onBack = { navController.popBackStack() },
                    onBuyClick = { navController.navigate(Routes.order(productId)) },
                    onTraceabilityClick = { navController.navigate(Routes.traceability(productId)) },
                )
            }
            composable(
                route = Routes.ORDER,
                arguments = listOf(navArgument("productId") { type = NavType.StringType }),
            ) { backStackEntry ->
                val productId = backStackEntry.arguments?.getString("productId") ?: return@composable
                OrderScreen(
                    productId = productId,
                    onBack = { navController.popBackStack() },
                    onOrderPlaced = {
                        navController.navigate(Routes.HOME) {
                            popUpTo(Routes.HOME) { inclusive = true }
                        }
                    },
                )
            }
            composable(
                route = Routes.TRACEABILITY,
                arguments = listOf(navArgument("productId") { type = NavType.StringType }),
            ) { backStackEntry ->
                val productId = backStackEntry.arguments?.getString("productId") ?: return@composable
                TraceabilityScreen(
                    productId = productId,
                    onBack = { navController.popBackStack() },
                )
            }
        }
    }
}
