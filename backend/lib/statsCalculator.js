// lib/statsCalculator.js
// Converts Docker's raw stats to human-readable percentages

function calculateCPUPercent(stats) {
  // 1. Get the change in CPU usage (delta)
  const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
  
  // 2. Get the change in System usage (delta)
  const systemDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
  
  // 3. Count available CPUs (cores)
  const cpuCount = stats.cpu_stats.online_cpus || stats.cpu_stats.cpu_usage.percpu_usage.length;

  if (systemDelta > 0 && cpuDelta > 0) {
    // 4. Calculate percentage
    return ((cpuDelta / systemDelta) * cpuCount * 100).toFixed(1);
  }
  return '0.0';
}

function calculateRamBytes(stats) {
  // Docker stores memory in bytes
  return stats.memory_stats.usage;
}

function calculateRamLimit(stats) {
  return stats.memory_stats.limit;
}

module.exports = { calculateCPUPercent, calculateRamBytes, calculateRamLimit };
