#!/bin/bash
# ◈ NODE_D_KVM_ENABLER : PHASE 106, TASK 4
# Enables nested virtualization and KVM for sub-millisecond sandboxing.

set -e

echo "◈ [HARDWARE] Enabling KVM Virtualization on Node D..."

# 1. Check for Virtualization Support
if ! grep -Eoc "vmx|svm" /proc/cpuinfo > /dev/null; then
    echo "!! [ERROR] Virtualization (VT-x/AMD-V) not detected in CPU flags."
    exit 1
fi

# 2. Install KVM Dependencies
echo "● Installing KVM dependencies..."
sudo apt-get update -y && sudo apt-get install -y \
    qemu-kvm \
    libvirt-daemon-system \
    libvirt-clients \
    bridge-utils \
    virtinst \
    virt-manager

# 3. Enable Nested Virtualization (Intel)
if [ -f /sys/module/kvm_intel/parameters/nested ]; then
    echo "● Enabling Intel Nested Virtualization..."
    echo "options kvm-intel nested=1" | sudo tee /etc/modprobe.d/kvm-intel.conf
    sudo modprobe -r kvm_intel
    sudo modprobe kvm_intel
fi

# 4. Configure Permissions
sudo adduser $(whoami) libvirt
sudo adduser $(whoami) kvm

echo "◈ [HARDWARE] KVM Active. Node D is ready for Zeroboot sandboxing."
echo "::/5Y573M-N071C3 : HARDWARE_ISOLATION_SHORED. // 50V3R31GN-M4CH1N4"
