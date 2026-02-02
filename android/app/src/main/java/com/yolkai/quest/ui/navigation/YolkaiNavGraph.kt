package com.yolkai.quest.ui.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.yolkai.quest.ui.screens.DashboardScreen
import com.yolkai.quest.ui.screens.MapScreen
import com.yolkai.quest.ui.screens.ModuleScreen
import com.yolkai.quest.ui.screens.SetupScreen

object Routes {
    const val DASHBOARD = "dashboard"
    const val SETUP = "setup"
    const val MAP = "map"
    const val MODULE = "module/{moduleId}"
}

@Composable
fun YolkaiNavGraph(
    navController: NavHostController = rememberNavController()
) {
    NavHost(
        navController = navController,
        startDestination = Routes.DASHBOARD
    ) {
        composable(Routes.DASHBOARD) {
            DashboardScreen(
                onStartQuestClick = { navController.navigate(Routes.SETUP) }
            )
        }
        
        composable(Routes.SETUP) {
            SetupScreen(
                onQuestGenerated = { navController.navigate(Routes.MAP) }
            )
        }
        
        composable(Routes.MAP) {
            MapScreen(
                onModuleSelect = { moduleId ->
                    navController.navigate("module/$moduleId")
                }
            )
        }
        
        composable(Routes.MODULE) { backStackEntry ->
            val moduleId = backStackEntry.arguments?.getString("moduleId")
            ModuleScreen(
                moduleId = moduleId,
                onModuleComplete = {
                    navController.popBackStack() // Simplistic back for now
                }
            )
        }
    }
}
