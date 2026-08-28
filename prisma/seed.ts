import { PrismaClient, RoleType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Designations
  const designations = await Promise.all([
    prisma.designation.upsert({ where: { name: "Software Engineer" }, update: {}, create: { name: "Software Engineer" } }),
    prisma.designation.upsert({ where: { name: "Senior Software Engineer" }, update: {}, create: { name: "Senior Software Engineer" } }),
    prisma.designation.upsert({ where: { name: "Engineering Manager" }, update: {}, create: { name: "Engineering Manager" } }),
    prisma.designation.upsert({ where: { name: "HR Manager" }, update: {}, create: { name: "HR Manager" } }),
    prisma.designation.upsert({ where: { name: "HR Executive" }, update: {}, create: { name: "HR Executive" } }),
    prisma.designation.upsert({ where: { name: "Finance Manager" }, update: {}, create: { name: "Finance Manager" } }),
    prisma.designation.upsert({ where: { name: "Accountant" }, update: {}, create: { name: "Accountant" } }),
    prisma.designation.upsert({ where: { name: "Marketing Manager" }, update: {}, create: { name: "Marketing Manager" } }),
    prisma.designation.upsert({ where: { name: "Operations Manager" }, update: {}, create: { name: "Operations Manager" } }),
  ]);

  const [swEng, seniorSwEng, engMgr, hrMgr, hrExec, finMgr, accountant, mktMgr, opsMgr] = designations;

  // Departments (created without manager first)
  const deptData = [
    { name: "Engineering", description: "Product and platform engineering" },
    { name: "Human Resources", description: "People operations and recruitment" },
    { name: "Finance", description: "Financial planning and accounting" },
    { name: "Marketing", description: "Brand, growth and communications" },
    { name: "Operations", description: "Business operations and facilities" },
  ];

  const depts: Record<string, { id: string }> = {};
  for (const d of deptData) {
    const dept = await prisma.department.upsert({
      where: { name: d.name },
      update: {},
      create: d,
    });
    depts[d.name] = dept;
  }

  const hash = await bcrypt.hash("Password123!", 12);

  // Create users + employees
  async function createEmployee(data: {
    email: string;
    role: RoleType;
    firstName: string;
    lastName: string;
    phone: string;
    joiningDate: Date;
    deptName: string;
    designationId: string;
    code: string;
  }) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) return prisma.employee.findUnique({ where: { userId: existing.id } });

    return prisma.user.create({
      data: {
        email: data.email,
        passwordHash: hash,
        role: data.role,
        employee: {
          create: {
            employeeCode: data.code,
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone,
            joiningDate: data.joiningDate,
            departmentId: depts[data.deptName].id,
            designationId: data.designationId,
          },
        },
      },
      include: { employee: true },
    }).then((u) => u.employee);
  }

  const superAdmin = await createEmployee({
    email: "admin@company.com",
    role: RoleType.SUPER_ADMIN,
    firstName: "Ritu",
    lastName: "Raj",
    phone: "+91-9876543210",
    joiningDate: new Date("2021-01-01"),
    deptName: "Engineering",
    designationId: engMgr.id,
    code: "EMP0001",
  });

  const hrUser = await createEmployee({
    email: "hr@company.com",
    role: RoleType.HR,
    firstName: "Priya",
    lastName: "Sharma",
    phone: "+91-9876543211",
    joiningDate: new Date("2021-03-15"),
    deptName: "Human Resources",
    designationId: hrMgr.id,
    code: "EMP0002",
  });

  const manager1 = await createEmployee({
    email: "manager@company.com",
    role: RoleType.MANAGER,
    firstName: "Arjun",
    lastName: "Mehta",
    phone: "+91-9876543212",
    joiningDate: new Date("2021-06-01"),
    deptName: "Engineering",
    designationId: seniorSwEng.id,
    code: "EMP0003",
  });

  const emp1 = await createEmployee({
    email: "alice@company.com",
    role: RoleType.EMPLOYEE,
    firstName: "Alice",
    lastName: "Johnson",
    phone: "+91-9876543213",
    joiningDate: new Date("2022-01-10"),
    deptName: "Engineering",
    designationId: swEng.id,
    code: "EMP0004",
  });

  const emp2 = await createEmployee({
    email: "bob@company.com",
    role: RoleType.EMPLOYEE,
    firstName: "Bob",
    lastName: "Wilson",
    phone: "+91-9876543214",
    joiningDate: new Date("2022-04-15"),
    deptName: "Finance",
    designationId: accountant.id,
    code: "EMP0005",
  });

  const emp3 = await createEmployee({
    email: "carol@company.com",
    role: RoleType.EMPLOYEE,
    firstName: "Carol",
    lastName: "Davis",
    phone: "+91-9876543215",
    joiningDate: new Date("2022-07-20"),
    deptName: "Marketing",
    designationId: mktMgr.id,
    code: "EMP0006",
  });

  const emp4 = await createEmployee({
    email: "david@company.com",
    role: RoleType.EMPLOYEE,
    firstName: "David",
    lastName: "Kumar",
    phone: "+91-9876543216",
    joiningDate: new Date("2023-01-05"),
    deptName: "Operations",
    designationId: opsMgr.id,
    code: "EMP0007",
  });

  const emp5 = await createEmployee({
    email: "eve@company.com",
    role: RoleType.EMPLOYEE,
    firstName: "Eve",
    lastName: "Patel",
    phone: "+91-9876543217",
    joiningDate: new Date("2023-03-10"),
    deptName: "Human Resources",
    designationId: hrExec.id,
    code: "EMP0008",
  });

  // Set department managers
  if (superAdmin) {
    await prisma.department.update({
      where: { name: "Engineering" },
      data: { managerId: superAdmin.id },
    });
  }
  if (hrUser) {
    await prisma.department.update({
      where: { name: "Human Resources" },
      data: { managerId: hrUser.id },
    });
  }

  // Leave types
  const leaveTypes = await Promise.all([
    prisma.leaveType.upsert({ where: { name: "Annual Leave" }, update: {}, create: { name: "Annual Leave", daysPerYear: 21, description: "Annual paid leave" } }),
    prisma.leaveType.upsert({ where: { name: "Sick Leave" }, update: {}, create: { name: "Sick Leave", daysPerYear: 10, description: "Medical leave" } }),
    prisma.leaveType.upsert({ where: { name: "Casual Leave" }, update: {}, create: { name: "Casual Leave", daysPerYear: 7, description: "Personal errands" } }),
  ]);

  // Leave balances for all employees
  const employees = [superAdmin, hrUser, manager1, emp1, emp2, emp3, emp4, emp5].filter(Boolean) as { id: string }[];
  const year = new Date().getFullYear();

  for (const emp of employees) {
    for (const lt of leaveTypes) {
      await prisma.leaveBalance.upsert({
        where: {
          employeeId_leaveTypeId_year: { employeeId: emp.id, leaveTypeId: lt.id, year },
        },
        update: {},
        create: {
          employeeId: emp.id,
          leaveTypeId: lt.id,
          year,
          totalDays: lt.daysPerYear,
          usedDays: 0,
          remainingDays: lt.daysPerYear,
        },
      });
    }
  }

  // Attendance records for last 7 days
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const emp of employees.slice(0, 5)) {
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      if (date.getDay() === 0 || date.getDay() === 6) continue; // Skip weekends

      const existing = await prisma.attendance.findUnique({
        where: { employeeId_date: { employeeId: emp.id, date } },
      });
      if (existing) continue;

      const checkIn = new Date(date);
      checkIn.setHours(9, Math.floor(Math.random() * 30), 0, 0);
      const checkOut = i === 0 ? null : new Date(date);
      if (checkOut) checkOut.setHours(17, Math.floor(Math.random() * 60), 0, 0);

      await prisma.attendance.create({
        data: {
          employeeId: emp.id,
          date,
          checkInTime: checkIn,
          checkOutTime: checkOut,
          workingMinutes: checkOut ? Math.floor((checkOut.getTime() - checkIn.getTime()) / 60000) : null,
          status: "PRESENT",
        },
      });
    }
  }

  // Sample leave requests
  if (emp1) {
    const annualLeave = leaveTypes[0];
    const existing = await prisma.leaveRequest.findFirst({ where: { employeeId: emp1.id } });
    if (!existing) {
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);
      const nextWeekEnd = new Date(nextWeek);
      nextWeekEnd.setDate(nextWeekEnd.getDate() + 2);

      await prisma.leaveRequest.create({
        data: {
          employeeId: emp1.id,
          leaveTypeId: annualLeave.id,
          startDate: nextWeek,
          endDate: nextWeekEnd,
          totalDays: 3,
          reason: "Family vacation planned",
          status: "PENDING",
        },
      });
    }
  }

  // Sample tasks
  const adminUser = await prisma.user.findUnique({ where: { email: "admin@company.com" } });
  const emp1User = emp1 ? await prisma.user.findUnique({ where: { email: "alice@company.com" } }) : null;

  if (adminUser) {
    const taskData = [
      { title: "Set up CI/CD pipeline", priority: "HIGH" as const, status: "IN_PROGRESS" as const, assignedToId: emp1User?.id },
      { title: "Review Q4 budget", priority: "URGENT" as const, status: "TODO" as const },
      { title: "Onboard new team members", priority: "MEDIUM" as const, status: "TODO" as const },
      { title: "Update employee handbook", priority: "LOW" as const, status: "COMPLETED" as const },
      { title: "Fix authentication bug", priority: "HIGH" as const, status: "IN_REVIEW" as const, assignedToId: emp1User?.id },
    ];

    for (const t of taskData) {
      const existing = await prisma.task.findFirst({ where: { title: t.title } });
      if (!existing) {
        const dueDate = new Date(today);
        dueDate.setDate(dueDate.getDate() + Math.floor(Math.random() * 14) + 1);
        await prisma.task.create({
          data: {
            title: t.title,
            priority: t.priority,
            status: t.status,
            createdById: adminUser.id,
            assignedToId: t.assignedToId || null,
            dueDate,
          },
        });
      }
    }
  }

  console.log("✅ Seeding complete!");
  console.log("\n📋 Demo credentials:");
  console.log("  Super Admin:  admin@company.com / Password123!");
  console.log("  HR:           hr@company.com / Password123!");
  console.log("  Manager:      manager@company.com / Password123!");
  console.log("  Employee:     alice@company.com / Password123!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
