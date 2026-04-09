#include <vulkan/vulkan.h>
#include <stdio.h>
#include <stdlib.h>

int main() {
    VkInstance instance;
    VkInstanceCreateInfo createInfo = {};
    createInfo.sType = VK_STRUCTURE_TYPE_INSTANCE_CREATE_INFO;
    
    VkResult result = vkCreateInstance(&createInfo, NULL, &instance);
    if (result != VK_SUCCESS) {
        printf("vkCreateInstance failed with error %d\n", result);
        return 1;
    }

    uint32_t deviceCount = 0;
    vkEnumeratePhysicalDevices(instance, &deviceCount, NULL);
    printf("Number of physical devices found: %u\n", deviceCount);

    if (deviceCount > 0) {
        VkPhysicalDevice* devices = malloc(sizeof(VkPhysicalDevice) * deviceCount);
        vkEnumeratePhysicalDevices(instance, &deviceCount, devices);
        for (uint32_t i = 0; i < deviceCount; i++) {
            VkPhysicalDeviceProperties deviceProperties;
            vkGetPhysicalDeviceProperties(devices[i], &deviceProperties);
            printf("Device %u: %s\n", i, deviceProperties.deviceName);
        }
        free(devices);
    }

    vkDestroyInstance(instance, NULL);
    return 0;
}
