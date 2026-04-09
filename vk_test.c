#include <vulkan/vulkan.h>
#include <stdio.h>

int main() {
    VkInstance instance;
    VkInstanceCreateInfo createInfo = {};
    createInfo.sType = VK_STRUCTURE_TYPE_INSTANCE_CREATE_INFO;
    
    VkResult result = vkCreateInstance(&createInfo, NULL, &instance);
    if (result == VK_SUCCESS) {
        printf("Vulkan Instance Created successfully!\n");
        vkDestroyInstance(instance, NULL);
    } else {
        printf("vkCreateInstance failed with error %d\n", result);
    }
    return 0;
}
