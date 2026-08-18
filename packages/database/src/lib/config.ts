export const getPortalConfig = () => {
  const employeeEnv = process.env.NEXT_PUBLIC_EMPLOYEE_PORTAL_URL;
  const managerEnv = process.env.NEXT_PUBLIC_MANAGER_PORTAL_URL;

  if (process.env.NODE_ENV === 'production') {
    if (!employeeEnv) {
      throw new Error('NEXT_PUBLIC_EMPLOYEE_PORTAL_URL must be defined in production');
    }
    if (!managerEnv) {
      throw new Error('NEXT_PUBLIC_MANAGER_PORTAL_URL must be defined in production');
    }
  }

  const employeeUrl = employeeEnv || 'http://localhost:3000';
  const managerUrl = managerEnv || 'http://localhost:3001';

  // Ensure URLs don't have trailing slashes so concatenation works cleanly
  return {
    employeeUrl: employeeUrl.replace(/\/$/, ''),
    managerUrl: managerUrl.replace(/\/$/, '')
  };
};

export const getEmployeePortalUrl = () => getPortalConfig().employeeUrl;
export const getManagerPortalUrl = () => getPortalConfig().managerUrl;
