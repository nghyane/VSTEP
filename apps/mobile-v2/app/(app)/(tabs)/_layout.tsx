import { Tabs } from "expo-router";
import { BrandIcon } from "@/components/BrandIcon";
import { CustomTabBar } from "@/components/CustomTabBar";

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Tổng quan",
          tabBarIcon: ({ focused, size }) => (
            <BrandIcon name="home" size={size + 4} active={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="practice"
        options={{
          title: "Luyện tập",
          tabBarIcon: ({ focused, size }) => (
            <BrandIcon name="practice" size={size + 4} active={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="exams"
        options={{
          title: "Thi thử",
          tabBarIcon: ({ focused, size }) => (
            <BrandIcon name="exam" size={size + 4} active={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="classes"
        options={{
          title: "Khóa học",
          tabBarIcon: ({ focused, size }) => (
            <BrandIcon name="course" size={size + 4} active={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Hồ sơ",
          tabBarIcon: ({ focused, size }) => (
            <BrandIcon name="profile" size={size + 4} active={focused} />
          ),
        }}
      />
      {/* Hidden routes */}
      <Tabs.Screen name="explore" options={{ href: null }} />
      <Tabs.Screen name="progress" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
    </Tabs>
  );
}
