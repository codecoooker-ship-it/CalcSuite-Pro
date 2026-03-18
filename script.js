const calculatorNav = document.getElementById("calculator-nav");
const calculatorCount = document.getElementById("calculator-count");
const calculatorSearch = document.getElementById("calculator-search");
const categoryList = document.getElementById("category-list");
const calculatorStage = document.getElementById("calculator-stage");
const calculatorToolbar = document.getElementById("calculator-toolbar");
const calculatorContent = document.getElementById("calculator-content");
const activeTitle = document.getElementById("active-title");
const activeDescription = document.getElementById("active-description");
const metricModes = document.getElementById("metric-modes");
const metricCategories = document.getElementById("metric-categories");
const metricHistory = document.getElementById("metric-history");
const themeSelect = document.getElementById("theme-select");
const stageFullscreenButton = document.getElementById("stage-fullscreen");
const mobileNavToggle = document.getElementById("mobile-nav-toggle");
const navPanel = document.getElementById("nav-panel");
const metricTheme = document.getElementById("metric-theme");
const heroToolsCount = document.getElementById("hero-tools-count");

const sharedState = {
  activeCalculatorId: "standard",
  activity: [],
  calculatorStates: {},
  activeTheme: "studio",
  searchQuery: "",
  activeUtilityTab: "workspace",
};

const MAX_ACTIVITY = 14;

function animateHeroToolsCount(target) {
  if (!heroToolsCount) {
    return;
  }

  const normalizedTarget = Number(target);
  if (!Number.isFinite(normalizedTarget)) {
    heroToolsCount.textContent = "100+";
    return;
  }

  if (heroToolsCount.dataset.target === String(normalizedTarget)) {
    return;
  }

  heroToolsCount.dataset.target = String(normalizedTarget);
  const startTime = performance.now();
  const duration = 950;

  function step(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const eased = 1 - ((1 - progress) ** 3);
    heroToolsCount.textContent = `${Math.round(normalizedTarget * eased)}+`;
    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  }

  window.requestAnimationFrame(step);
}

function formatNumber(value, digits = 2) {
  if (!Number.isFinite(value)) {
    return "Error";
  }
  return Number(value.toFixed(digits)).toLocaleString(undefined, {
    maximumFractionDigits: digits,
  });
}

function formatPrecise(value) {
  if (!Number.isFinite(value)) {
    return "Error";
  }
  const normalized = Math.abs(value) < 1e-12 ? 0 : value;
  return Number(normalized.toPrecision(12)).toString();
}

function parseNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
}

function parseNumberList(value) {
  return value
    .split(",")
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isFinite(item));
}

function gcd(a, b) {
  let x = Math.abs(Math.round(a));
  let y = Math.abs(Math.round(b));
  while (y) {
    const temp = y;
    y = x % y;
    x = temp;
  }
  return x || 1;
}

function daysBetween(dateA, dateB) {
  return Math.floor(Math.abs(dateB.getTime() - dateA.getTime()) / 86400000);
}

function monthDiff(startDate, endDate) {
  let months =
    (endDate.getFullYear() - startDate.getFullYear()) * 12 +
    (endDate.getMonth() - startDate.getMonth());
  if (endDate.getDate() < startDate.getDate()) {
    months -= 1;
  }
  return months;
}

function yearsMonthsDays(fromDate, toDate) {
  let years = toDate.getFullYear() - fromDate.getFullYear();
  let months = toDate.getMonth() - fromDate.getMonth();
  let days = toDate.getDate() - fromDate.getDate();

  if (days < 0) {
    const previousMonth = new Date(toDate.getFullYear(), toDate.getMonth(), 0);
    days += previousMonth.getDate();
    months -= 1;
  }
  if (months < 0) {
    months += 12;
    years -= 1;
  }
  return { years, months, days };
}

function addActivity(calculator, summary, detail) {
  sharedState.activity.unshift({
    calculator,
    summary,
    detail,
    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  });
  sharedState.activity = sharedState.activity.slice(0, MAX_ACTIVITY);
  renderActivity();
}

function getActivityMarkup() {
  if (!sharedState.activity.length) {
    return '<p class="empty-state">Results from any calculator will appear here.</p>';
  }

  return sharedState.activity
    .map(
      (item) => `
        <article class="activity-item">
          <span class="activity-meta">${item.calculator} | ${item.time}</span>
          <strong>${item.summary}</strong>
          <div class="subtle-copy">${item.detail}</div>
        </article>
      `,
    )
    .join("");
}

function renderActivity() {
  metricHistory.textContent = String(sharedState.activity.length);
  document.querySelectorAll("[data-activity-feed]").forEach((node) => {
    node.innerHTML = getActivityMarkup();
  });
}

const calculatorDefinitions = [
  { id: "standard", title: "Standard Calculator", short: "Standard", category: "Core", description: "Fast everyday arithmetic with memory, history, and a desktop-style keypad.", mode: "standard" },
  { id: "scientific", title: "Scientific Calculator", short: "Scientific", category: "Core", description: "Scientific functions including powers, trigonometry, logs, constants, and factorials.", mode: "scientific" },
  {
    id: "age",
    title: "Age Calculator",
    short: "Age",
    category: "Date & Time",
    description: "Calculate exact age in years, months, and days from date of birth.",
    fields: [
      { name: "birthDate", label: "Date of birth", type: "date" },
      { name: "compareDate", label: "Calculate as of", type: "date", defaultValue: new Date().toISOString().slice(0, 10) },
    ],
    compute: ({ birthDate, compareDate }) => {
      const start = new Date(birthDate);
      const end = new Date(compareDate);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
        throw new Error("Enter a valid birth date and comparison date.");
      }
      const age = yearsMonthsDays(start, end);
      return {
        summary: `${age.years} years`,
        detail: `${age.months} months, ${age.days} days`,
        rows: [
          ["Age", `${age.years} years, ${age.months} months, ${age.days} days`],
          ["Total months", formatNumber(monthDiff(start, end), 0)],
          ["Total days", formatNumber(daysBetween(start, end), 0)],
        ],
      };
    },
  },
  {
    id: "date-difference",
    title: "Date Difference",
    short: "Date Diff",
    category: "Date & Time",
    description: "Measure the exact time span between any two dates.",
    fields: [
      { name: "startDate", label: "Start date", type: "date" },
      { name: "endDate", label: "End date", type: "date", defaultValue: new Date().toISOString().slice(0, 10) },
    ],
    compute: ({ startDate, endDate }) => {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
        throw new Error("Choose a valid start and end date.");
      }
      const diff = yearsMonthsDays(start, end);
      const days = daysBetween(start, end);
      return {
        summary: `${days} days`,
        detail: `${diff.years}y ${diff.months}m ${diff.days}d`,
        rows: [
          ["Difference", `${diff.years} years, ${diff.months} months, ${diff.days} days`],
          ["Total weeks", formatNumber(days / 7, 2)],
          ["Total days", formatNumber(days, 0)],
        ],
      };
    },
  },
  {
    id: "time-duration",
    title: "Time Duration",
    short: "Duration",
    category: "Date & Time",
    description: "Find the time difference between two clock times in hours and minutes.",
    fields: [
      { name: "startTime", label: "Start time", type: "time" },
      { name: "endTime", label: "End time", type: "time" },
    ],
    compute: ({ startTime, endTime }) => {
      const [sh, sm] = startTime.split(":").map(Number);
      const [eh, em] = endTime.split(":").map(Number);
      let startMinutes = sh * 60 + sm;
      let endMinutes = eh * 60 + em;
      if (endMinutes < startMinutes) endMinutes += 1440;
      const total = endMinutes - startMinutes;
      return {
        summary: `${Math.floor(total / 60)}h ${total % 60}m`,
        detail: "Overnight times are handled automatically.",
        rows: [["Hours", formatNumber(total / 60, 2)], ["Minutes", formatNumber(total, 0)]],
      };
    },
  },
  {
    id: "due-date",
    title: "Due Date Calculator",
    short: "Due Date",
    category: "Date & Time",
    description: "Estimate a due date from the first day of the last menstrual period.",
    fields: [
      { name: "lmpDate", label: "Last menstrual period", type: "date" },
      { name: "cycleLength", label: "Cycle length (days)", type: "number", defaultValue: 28, min: 20, max: 40, step: 1 },
    ],
    compute: ({ lmpDate, cycleLength }) => {
      const start = new Date(lmpDate);
      const cycle = parseNumber(cycleLength);
      if (Number.isNaN(start.getTime()) || Number.isNaN(cycle)) {
        throw new Error("Enter a valid date and cycle length.");
      }
      const due = new Date(start);
      due.setDate(due.getDate() + 280 + (cycle - 28));
      return {
        summary: due.toLocaleDateString(),
        detail: "Estimated due date",
        rows: [
          ["Due date", due.toLocaleDateString()],
          ["Days until due", formatNumber(Math.max(Math.ceil((due.getTime() - Date.now()) / 86400000), 0), 0)],
          ["Weeks from LMP", "40 weeks approx."],
        ],
      };
    },
  },
  {
    id: "loan",
    title: "Loan EMI Calculator",
    short: "Loan EMI",
    category: "Finance",
    description: "Calculate monthly loan payments, total interest, and repayment amount.",
    fields: [
      { name: "principal", label: "Loan amount", type: "number", defaultValue: 100000, step: 1000 },
      { name: "annualRate", label: "Annual interest rate (%)", type: "number", defaultValue: 9.5, step: 0.1 },
      { name: "years", label: "Loan term (years)", type: "number", defaultValue: 5, step: 1 },
    ],
    compute: ({ principal, annualRate, years }) => {
      const p = parseNumber(principal);
      const rate = parseNumber(annualRate) / 1200;
      const n = parseNumber(years) * 12;
      if (!p || !n) throw new Error("Enter a valid principal and term.");
      const emi = rate === 0 ? p / n : (p * rate * (1 + rate) ** n) / ((1 + rate) ** n - 1);
      const total = emi * n;
      return {
        summary: formatNumber(emi),
        detail: "Monthly installment",
        rows: [["Monthly EMI", formatNumber(emi)], ["Total interest", formatNumber(total - p)], ["Total payment", formatNumber(total)]],
      };
    },
  },
  {
    id: "mortgage",
    title: "Mortgage Calculator",
    short: "Mortgage",
    category: "Finance",
    description: "Estimate monthly mortgage payments and financed amount.",
    fields: [
      { name: "homePrice", label: "Home price", type: "number", defaultValue: 350000, step: 1000 },
      { name: "downPayment", label: "Down payment", type: "number", defaultValue: 70000, step: 1000 },
      { name: "interestRate", label: "Interest rate (%)", type: "number", defaultValue: 6.5, step: 0.1 },
      { name: "termYears", label: "Term (years)", type: "number", defaultValue: 30, step: 1 },
    ],
    compute: ({ homePrice, downPayment, interestRate, termYears }) => {
      const amount = parseNumber(homePrice) - parseNumber(downPayment);
      const rate = parseNumber(interestRate) / 1200;
      const n = parseNumber(termYears) * 12;
      if (amount <= 0 || !n) throw new Error("Enter a valid price, down payment, and term.");
      const payment = rate === 0 ? amount / n : (amount * rate * (1 + rate) ** n) / ((1 + rate) ** n - 1);
      return {
        summary: formatNumber(payment),
        detail: "Estimated monthly mortgage payment",
        rows: [["Loan amount", formatNumber(amount)], ["Monthly payment", formatNumber(payment)], ["Total paid", formatNumber(payment * n)]],
      };
    },
  },
  {
    id: "compound-interest",
    title: "Compound Interest",
    short: "Compound",
    category: "Finance",
    description: "Project investment growth with recurring compounding over time.",
    fields: [
      { name: "initial", label: "Initial amount", type: "number", defaultValue: 5000, step: 100 },
      { name: "contribution", label: "Annual contribution", type: "number", defaultValue: 1200, step: 100 },
      { name: "rate", label: "Annual return (%)", type: "number", defaultValue: 8, step: 0.1 },
      { name: "years", label: "Years", type: "number", defaultValue: 10, step: 1 },
    ],
    compute: ({ initial, contribution, rate, years }) => {
      let balance = parseNumber(initial);
      const yearlyContribution = parseNumber(contribution);
      const growth = parseNumber(rate) / 100;
      const totalYears = parseNumber(years);
      for (let year = 0; year < totalYears; year += 1) {
        balance = balance * (1 + growth) + yearlyContribution;
      }
      const invested = parseNumber(initial) + yearlyContribution * totalYears;
      return {
        summary: formatNumber(balance),
        detail: "Projected future value",
        rows: [["Future value", formatNumber(balance)], ["Total invested", formatNumber(invested)], ["Estimated growth", formatNumber(balance - invested)]],
      };
    },
  },
  {
    id: "discount",
    title: "Discount Calculator",
    short: "Discount",
    category: "Finance",
    description: "Find discount amount, final sale price, and savings percentage.",
    fields: [
      { name: "originalPrice", label: "Original price", type: "number", defaultValue: 120, step: 1 },
      { name: "discountPercent", label: "Discount (%)", type: "number", defaultValue: 15, step: 0.1 },
    ],
    compute: ({ originalPrice, discountPercent }) => {
      const price = parseNumber(originalPrice);
      const discount = parseNumber(discountPercent);
      const save = (price * discount) / 100;
      return {
        summary: formatNumber(price - save),
        detail: "Final price after discount",
        rows: [["Savings", formatNumber(save)], ["Final price", formatNumber(price - save)], ["Discount rate", `${formatNumber(discount, 1)}%`]],
      };
    },
  },
  {
    id: "tip",
    title: "Tip Calculator",
    short: "Tip",
    category: "Finance",
    description: "Split a restaurant bill with tip across any number of people.",
    fields: [
      { name: "billAmount", label: "Bill amount", type: "number", defaultValue: 85, step: 0.01 },
      { name: "tipPercent", label: "Tip (%)", type: "number", defaultValue: 12, step: 0.1 },
      { name: "people", label: "People", type: "number", defaultValue: 3, step: 1 },
    ],
    compute: ({ billAmount, tipPercent, people }) => {
      const bill = parseNumber(billAmount);
      const tip = (bill * parseNumber(tipPercent)) / 100;
      const party = Math.max(parseNumber(people), 1);
      const total = bill + tip;
      return {
        summary: formatNumber(total / party),
        detail: "Per person total",
        rows: [["Tip amount", formatNumber(tip)], ["Grand total", formatNumber(total)], ["Per person", formatNumber(total / party)]],
      };
    },
  },
  {
    id: "vat",
    title: "VAT / Tax Calculator",
    short: "VAT / Tax",
    category: "Finance",
    description: "Add VAT or sales tax using a custom percentage rate.",
    fields: [
      { name: "amount", label: "Base amount", type: "number", defaultValue: 1000, step: 1 },
      { name: "taxRate", label: "Tax rate (%)", type: "number", defaultValue: 15, step: 0.1 },
    ],
    compute: ({ amount, taxRate }) => {
      const base = parseNumber(amount);
      const rate = parseNumber(taxRate);
      const tax = (base * rate) / 100;
      return {
        summary: formatNumber(base + tax),
        detail: "Amount including tax",
        rows: [["Tax amount", formatNumber(tax)], ["Inclusive total", formatNumber(base + tax)], ["Tax-exclusive base", formatNumber(base)]],
      };
    },
  },
  {
    id: "percentage",
    title: "Percentage Calculator",
    short: "Percentage",
    category: "Math",
    description: "Calculate what percent one number is of another.",
    fields: [
      { name: "value", label: "Value", type: "number", defaultValue: 45, step: 0.01 },
      { name: "base", label: "Base", type: "number", defaultValue: 120, step: 0.01 },
    ],
    compute: ({ value, base }) => {
      const current = parseNumber(value);
      const total = parseNumber(base);
      if (total === 0) throw new Error("Base value cannot be zero.");
      return {
        summary: `${formatNumber((current / total) * 100, 2)}%`,
        detail: "Value as a percentage of the base",
        rows: [["Percentage", `${formatNumber((current / total) * 100, 2)}%`], ["Difference", formatNumber(total - current)], ["Value needed for 100%", formatNumber(total)]],
      };
    },
  },
  {
    id: "bmi",
    title: "BMI Calculator",
    short: "BMI",
    category: "Health",
    description: "Check body mass index and weight category from height and weight.",
    fields: [
      { name: "weight", label: "Weight (kg)", type: "number", defaultValue: 72, step: 0.1 },
      { name: "heightCm", label: "Height (cm)", type: "number", defaultValue: 175, step: 0.1 },
    ],
    compute: ({ weight, heightCm }) => {
      const kg = parseNumber(weight);
      const meters = parseNumber(heightCm) / 100;
      const bmi = kg / (meters * meters);
      let category = "Normal";
      if (bmi < 18.5) category = "Underweight";
      if (bmi >= 25) category = "Overweight";
      if (bmi >= 30) category = "Obese";
      return {
        summary: formatNumber(bmi, 1),
        detail: category,
        rows: [["BMI", formatNumber(bmi, 1)], ["Category", category], ["Healthy weight range", `${formatNumber(18.5 * meters * meters, 1)} - ${formatNumber(24.9 * meters * meters, 1)} kg`]],
      };
    },
  },
  {
    id: "bmr",
    title: "BMR & TDEE",
    short: "BMR / TDEE",
    category: "Health",
    description: "Estimate daily calorie needs from body data and activity level.",
    fields: [
      { name: "gender", label: "Gender", type: "select", options: ["male", "female"], defaultValue: "male" },
      { name: "age", label: "Age", type: "number", defaultValue: 28, step: 1 },
      { name: "weight", label: "Weight (kg)", type: "number", defaultValue: 72, step: 0.1 },
      { name: "height", label: "Height (cm)", type: "number", defaultValue: 175, step: 0.1 },
      { name: "activity", label: "Activity level", type: "select", options: ["sedentary", "light", "moderate", "active", "very active"], defaultValue: "moderate" },
    ],
    compute: ({ gender, age, weight, height, activity }) => {
      let bmr = 10 * parseNumber(weight) + 6.25 * parseNumber(height) - 5 * parseNumber(age);
      bmr += gender === "male" ? 5 : -161;
      const factors = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, "very active": 1.9 };
      const tdee = bmr * factors[activity];
      return {
        summary: formatNumber(tdee, 0),
        detail: "Estimated maintenance calories",
        rows: [["BMR", `${formatNumber(bmr, 0)} kcal/day`], ["TDEE", `${formatNumber(tdee, 0)} kcal/day`], ["Mild cut target", `${formatNumber(tdee - 400, 0)} kcal/day`]],
      };
    },
  },
  {
    id: "water-intake",
    title: "Water Intake",
    short: "Water",
    category: "Health",
    description: "Estimate daily water intake based on body weight and activity.",
    fields: [
      { name: "weight", label: "Weight (kg)", type: "number", defaultValue: 72, step: 0.1 },
      { name: "exerciseMinutes", label: "Exercise (minutes)", type: "number", defaultValue: 30, step: 1 },
    ],
    compute: ({ weight, exerciseMinutes }) => {
      const liters = parseNumber(weight) * 0.035 + (parseNumber(exerciseMinutes) / 30) * 0.35;
      return {
        summary: `${formatNumber(liters, 2)} L`,
        detail: "Suggested daily intake",
        rows: [["Liters", `${formatNumber(liters, 2)} L`], ["Milliliters", `${formatNumber(liters * 1000, 0)} ml`], ["250 ml glasses", formatNumber((liters * 1000) / 250, 1)]],
      };
    },
  },
  {
    id: "unit-converter",
    title: "Length Converter",
    short: "Length",
    category: "Conversion",
    description: "Convert between meters, kilometers, miles, feet, and inches.",
    fields: [
      { name: "value", label: "Value", type: "number", defaultValue: 10, step: 0.01 },
      { name: "fromUnit", label: "From", type: "select", options: ["meter", "kilometer", "mile", "foot", "inch"], defaultValue: "meter" },
      { name: "toUnit", label: "To", type: "select", options: ["meter", "kilometer", "mile", "foot", "inch"], defaultValue: "mile" },
    ],
    compute: ({ value, fromUnit, toUnit }) => {
      const rates = { meter: 1, kilometer: 1000, mile: 1609.344, foot: 0.3048, inch: 0.0254 };
      const meters = parseNumber(value) * rates[fromUnit];
      const converted = meters / rates[toUnit];
      return {
        summary: formatNumber(converted, 4),
        detail: `${fromUnit} to ${toUnit}`,
        rows: [["Converted value", formatNumber(converted, 4)], ["Meters", formatNumber(meters, 4)], ["Reference", `1 ${fromUnit} = ${formatNumber(rates[fromUnit] / rates[toUnit], 6)} ${toUnit}`]],
      };
    },
  },
  {
    id: "temperature",
    title: "Temperature Converter",
    short: "Temperature",
    category: "Conversion",
    description: "Convert temperatures between Celsius, Fahrenheit, and Kelvin.",
    fields: [
      { name: "value", label: "Temperature", type: "number", defaultValue: 25, step: 0.1 },
      { name: "scale", label: "Scale", type: "select", options: ["Celsius", "Fahrenheit", "Kelvin"], defaultValue: "Celsius" },
    ],
    compute: ({ value, scale }) => {
      const current = parseNumber(value);
      let celsius = current;
      if (scale === "Fahrenheit") celsius = (current - 32) * (5 / 9);
      if (scale === "Kelvin") celsius = current - 273.15;
      return {
        summary: `${formatNumber(celsius, 2)} C`,
        detail: "Converted across all major scales",
        rows: [["Celsius", `${formatNumber(celsius, 2)} C`], ["Fahrenheit", `${formatNumber(celsius * (9 / 5) + 32, 2)} F`], ["Kelvin", `${formatNumber(celsius + 273.15, 2)} K`]],
      };
    },
  },
  {
    id: "speed",
    title: "Speed Calculator",
    short: "Speed",
    category: "Conversion",
    description: "Calculate average speed from distance and travel time.",
    fields: [
      { name: "distance", label: "Distance (km)", type: "number", defaultValue: 120, step: 0.1 },
      { name: "hours", label: "Time (hours)", type: "number", defaultValue: 2, step: 0.1 },
    ],
    compute: ({ distance, hours }) => {
      const speed = parseNumber(distance) / parseNumber(hours);
      return {
        summary: `${formatNumber(speed, 2)} km/h`,
        detail: "Average speed",
        rows: [["Kilometers per hour", `${formatNumber(speed, 2)} km/h`], ["Meters per second", `${formatNumber(speed / 3.6, 2)} m/s`], ["Miles per hour", `${formatNumber(speed * 0.621371, 2)} mph`]],
      };
    },
  },
  {
    id: "fuel",
    title: "Fuel Cost Calculator",
    short: "Fuel Cost",
    category: "Conversion",
    description: "Estimate fuel needed and cost for any trip.",
    fields: [
      { name: "tripDistance", label: "Trip distance (km)", type: "number", defaultValue: 180, step: 1 },
      { name: "efficiency", label: "Fuel efficiency (km/L)", type: "number", defaultValue: 14, step: 0.1 },
      { name: "fuelPrice", label: "Fuel price per liter", type: "number", defaultValue: 1.3, step: 0.01 },
    ],
    compute: ({ tripDistance, efficiency, fuelPrice }) => {
      const liters = parseNumber(tripDistance) / parseNumber(efficiency);
      const cost = liters * parseNumber(fuelPrice);
      return {
        summary: formatNumber(cost),
        detail: "Estimated trip fuel cost",
        rows: [["Fuel needed", `${formatNumber(liters, 2)} L`], ["Fuel cost", formatNumber(cost)], ["Cost per km", formatNumber(cost / parseNumber(tripDistance), 3)]],
      };
    },
  },
  {
    id: "gpa",
    title: "GPA Calculator",
    short: "GPA",
    category: "Education",
    description: "Compute grade point average from course grades and credit hours.",
    fields: [
      { name: "course1Grade", label: "Course 1 grade point", type: "number", defaultValue: 3.7, step: 0.1 },
      { name: "course1Credit", label: "Course 1 credit", type: "number", defaultValue: 3, step: 1 },
      { name: "course2Grade", label: "Course 2 grade point", type: "number", defaultValue: 3.3, step: 0.1 },
      { name: "course2Credit", label: "Course 2 credit", type: "number", defaultValue: 3, step: 1 },
      { name: "course3Grade", label: "Course 3 grade point", type: "number", defaultValue: 4, step: 0.1 },
      { name: "course3Credit", label: "Course 3 credit", type: "number", defaultValue: 4, step: 1 },
    ],
    compute: (values) => {
      const pairs = [
        [parseNumber(values.course1Grade), parseNumber(values.course1Credit)],
        [parseNumber(values.course2Grade), parseNumber(values.course2Credit)],
        [parseNumber(values.course3Grade), parseNumber(values.course3Credit)],
      ];
      const totalCredits = pairs.reduce((sum, [, credit]) => sum + credit, 0);
      const points = pairs.reduce((sum, [grade, credit]) => sum + grade * credit, 0);
      const gpa = points / totalCredits;
      return {
        summary: formatNumber(gpa, 2),
        detail: "Weighted GPA",
        rows: [["GPA", formatNumber(gpa, 2)], ["Credits", formatNumber(totalCredits, 0)], ["Quality points", formatNumber(points, 2)]],
      };
    },
  },
  {
    id: "grade",
    title: "Grade Calculator",
    short: "Grade",
    category: "Education",
    description: "Turn raw marks into percentages and letter grades.",
    fields: [
      { name: "score", label: "Score obtained", type: "number", defaultValue: 84, step: 0.1 },
      { name: "total", label: "Total marks", type: "number", defaultValue: 100, step: 0.1 },
    ],
    compute: ({ score, total }) => {
      const percentage = (parseNumber(score) / parseNumber(total)) * 100;
      let letter = "F";
      if (percentage >= 90) letter = "A";
      else if (percentage >= 80) letter = "B";
      else if (percentage >= 70) letter = "C";
      else if (percentage >= 60) letter = "D";
      return {
        summary: `${formatNumber(percentage, 2)}%`,
        detail: `Grade ${letter}`,
        rows: [["Percentage", `${formatNumber(percentage, 2)}%`], ["Letter grade", letter], ["Result", percentage >= 50 ? "Pass" : "Needs improvement"]],
      };
    },
  },
  {
    id: "area",
    title: "Area Calculator",
    short: "Area",
    category: "Geometry",
    description: "Calculate rectangle area from length and width.",
    fields: [
      { name: "length", label: "Length", type: "number", defaultValue: 12, step: 0.1 },
      { name: "width", label: "Width", type: "number", defaultValue: 8, step: 0.1 },
    ],
    compute: ({ length, width }) => {
      const l = parseNumber(length);
      const w = parseNumber(width);
      return {
        summary: formatNumber(l * w, 2),
        detail: "Rectangle area",
        rows: [["Area", formatNumber(l * w, 2)], ["Perimeter", formatNumber(2 * (l + w), 2)], ["Diagonal", formatNumber(Math.sqrt(l ** 2 + w ** 2), 2)]],
      };
    },
  },
  {
    id: "volume",
    title: "Volume Calculator",
    short: "Volume",
    category: "Geometry",
    description: "Calculate cuboid volume from length, width, and height.",
    fields: [
      { name: "length", label: "Length", type: "number", defaultValue: 6, step: 0.1 },
      { name: "width", label: "Width", type: "number", defaultValue: 4, step: 0.1 },
      { name: "height", label: "Height", type: "number", defaultValue: 3, step: 0.1 },
    ],
    compute: ({ length, width, height }) => {
      const l = parseNumber(length);
      const w = parseNumber(width);
      const h = parseNumber(height);
      return {
        summary: formatNumber(l * w * h, 2),
        detail: "Cuboid volume",
        rows: [["Volume", formatNumber(l * w * h, 2)], ["Surface area", formatNumber(2 * (l * w + l * h + w * h), 2)], ["Space diagonal", formatNumber(Math.sqrt(l ** 2 + w ** 2 + h ** 2), 2)]],
      };
    },
  },
  {
    id: "circle",
    title: "Circle Calculator",
    short: "Circle",
    category: "Geometry",
    description: "Compute circumference and area from a circle radius.",
    fields: [{ name: "radius", label: "Radius", type: "number", defaultValue: 7, step: 0.1 }],
    compute: ({ radius }) => {
      const r = parseNumber(radius);
      return {
        summary: formatNumber(Math.PI * r * r, 2),
        detail: "Circle area",
        rows: [["Area", formatNumber(Math.PI * r * r, 2)], ["Circumference", formatNumber(2 * Math.PI * r, 2)], ["Diameter", formatNumber(r * 2, 2)]],
      };
    },
  },
  {
    id: "electricity",
    title: "Electricity Cost",
    short: "Electricity",
    category: "Utility",
    description: "Estimate energy consumption cost by wattage, usage, and tariff.",
    fields: [
      { name: "wattage", label: "Appliance wattage", type: "number", defaultValue: 1200, step: 1 },
      { name: "hoursPerDay", label: "Hours per day", type: "number", defaultValue: 4, step: 0.1 },
      { name: "days", label: "Number of days", type: "number", defaultValue: 30, step: 1 },
      { name: "rate", label: "Rate per kWh", type: "number", defaultValue: 0.18, step: 0.01 },
    ],
    compute: ({ wattage, hoursPerDay, days, rate }) => {
      const kwh = (parseNumber(wattage) / 1000) * parseNumber(hoursPerDay) * parseNumber(days);
      const cost = kwh * parseNumber(rate);
      return {
        summary: formatNumber(cost),
        detail: "Estimated electricity cost",
        rows: [["Energy use", `${formatNumber(kwh, 2)} kWh`], ["Cost", formatNumber(cost)], ["Daily average", formatNumber(cost / parseNumber(days))]],
      };
    },
  },
  {
    id: "split-bill",
    title: "Bill Splitter",
    short: "Split Bill",
    category: "Utility",
    description: "Split shared bills evenly and add an optional service charge.",
    fields: [
      { name: "amount", label: "Total amount", type: "number", defaultValue: 240, step: 0.01 },
      { name: "service", label: "Service charge (%)", type: "number", defaultValue: 5, step: 0.1 },
      { name: "members", label: "People", type: "number", defaultValue: 6, step: 1 },
    ],
    compute: ({ amount, service, members }) => {
      const total = parseNumber(amount) * (1 + parseNumber(service) / 100);
      const count = Math.max(parseNumber(members), 1);
      return {
        summary: formatNumber(total / count),
        detail: "Per person share",
        rows: [["Total with charge", formatNumber(total)], ["Per person", formatNumber(total / count)], ["Service amount", formatNumber(total - parseNumber(amount))]],
      };
    },
  },
  {
    id: "savings-goal",
    title: "Savings Goal",
    short: "Savings Goal",
    category: "Utility",
    description: "See how much you need to save monthly to hit a target amount.",
    fields: [
      { name: "goal", label: "Goal amount", type: "number", defaultValue: 12000, step: 100 },
      { name: "current", label: "Current savings", type: "number", defaultValue: 1500, step: 100 },
      { name: "months", label: "Months to goal", type: "number", defaultValue: 12, step: 1 },
    ],
    compute: ({ goal, current, months }) => {
      const target = parseNumber(goal);
      const existing = parseNumber(current);
      const monthsValue = Math.max(parseNumber(months), 1);
      const needed = Math.max(target - existing, 0);
      return {
        summary: formatNumber(needed / monthsValue),
        detail: "Monthly saving needed",
        rows: [["Remaining amount", formatNumber(needed)], ["Per month", formatNumber(needed / monthsValue)], ["Current progress", `${formatNumber((existing / target) * 100, 1)}%`]],
      };
    },
  },
  {
    id: "simple-interest",
    title: "Simple Interest",
    short: "Simple Interest",
    category: "Finance",
    description: "Calculate interest earned without compounding.",
    fields: [
      { name: "principal", label: "Principal", type: "number", defaultValue: 5000, step: 100 },
      { name: "rate", label: "Rate (%)", type: "number", defaultValue: 7, step: 0.1 },
      { name: "years", label: "Years", type: "number", defaultValue: 3, step: 0.5 },
    ],
    compute: ({ principal, rate, years }) => {
      const p = parseNumber(principal);
      const r = parseNumber(rate) / 100;
      const t = parseNumber(years);
      const interest = p * r * t;
      return {
        summary: formatNumber(p + interest),
        detail: "Final amount with simple interest",
        rows: [["Interest earned", formatNumber(interest)], ["Final amount", formatNumber(p + interest)], ["Annual interest", formatNumber(p * r)]],
      };
    },
  },
  {
    id: "roi",
    title: "ROI Calculator",
    short: "ROI",
    category: "Finance",
    description: "Measure return on investment from gain and cost.",
    fields: [
      { name: "gain", label: "Total return", type: "number", defaultValue: 12500, step: 100 },
      { name: "cost", label: "Investment cost", type: "number", defaultValue: 10000, step: 100 },
    ],
    compute: ({ gain, cost }) => {
      const totalGain = parseNumber(gain);
      const totalCost = parseNumber(cost);
      const profit = totalGain - totalCost;
      const roi = (profit / totalCost) * 100;
      return {
        summary: `${formatNumber(roi, 2)}%`,
        detail: "Return on investment",
        rows: [["Net profit", formatNumber(profit)], ["ROI", `${formatNumber(roi, 2)}%`], ["Return multiple", `${formatNumber(totalGain / totalCost, 2)}x`]],
      };
    },
  },
  {
    id: "profit-margin",
    title: "Profit Margin",
    short: "Margin",
    category: "Finance",
    description: "Calculate net profit, margin, and markup from revenue and cost.",
    fields: [
      { name: "revenue", label: "Revenue", type: "number", defaultValue: 2400, step: 10 },
      { name: "cost", label: "Cost", type: "number", defaultValue: 1500, step: 10 },
    ],
    compute: ({ revenue, cost }) => {
      const rev = parseNumber(revenue);
      const baseCost = parseNumber(cost);
      const profit = rev - baseCost;
      return {
        summary: `${formatNumber((profit / rev) * 100, 2)}%`,
        detail: "Profit margin",
        rows: [["Profit", formatNumber(profit)], ["Margin", `${formatNumber((profit / rev) * 100, 2)}%`], ["Markup", `${formatNumber((profit / baseCost) * 100, 2)}%`]],
      };
    },
  },
  {
    id: "commission",
    title: "Commission Calculator",
    short: "Commission",
    category: "Finance",
    description: "Find commission earned from sales and commission rate.",
    fields: [
      { name: "sales", label: "Sales amount", type: "number", defaultValue: 8200, step: 10 },
      { name: "rate", label: "Commission (%)", type: "number", defaultValue: 6, step: 0.1 },
    ],
    compute: ({ sales, rate }) => {
      const salesValue = parseNumber(sales);
      const rateValue = parseNumber(rate);
      const commission = (salesValue * rateValue) / 100;
      return {
        summary: formatNumber(commission),
        detail: "Commission earned",
        rows: [["Commission", formatNumber(commission)], ["After commission", formatNumber(salesValue - commission)], ["Rate", `${formatNumber(rateValue, 2)}%`]],
      };
    },
  },
  {
    id: "break-even",
    title: "Break-even Calculator",
    short: "Break-even",
    category: "Finance",
    description: "Estimate how many units you need to sell to break even.",
    fields: [
      { name: "fixedCost", label: "Fixed costs", type: "number", defaultValue: 5000, step: 100 },
      { name: "pricePerUnit", label: "Price per unit", type: "number", defaultValue: 45, step: 0.1 },
      { name: "variableCost", label: "Variable cost per unit", type: "number", defaultValue: 20, step: 0.1 },
    ],
    compute: ({ fixedCost, pricePerUnit, variableCost }) => {
      const fixed = parseNumber(fixedCost);
      const price = parseNumber(pricePerUnit);
      const variable = parseNumber(variableCost);
      const contribution = price - variable;
      return {
        summary: formatNumber(Math.ceil(fixed / contribution), 0),
        detail: "Units required to break even",
        rows: [["Contribution margin", formatNumber(contribution)], ["Break-even units", formatNumber(Math.ceil(fixed / contribution), 0)], ["Break-even sales", formatNumber(Math.ceil(fixed / contribution) * price)]],
      };
    },
  },
  {
    id: "salary-converter",
    title: "Salary Converter",
    short: "Salary",
    category: "Finance",
    description: "Convert hourly, monthly, or yearly pay into comparable ranges.",
    fields: [
      { name: "amount", label: "Amount", type: "number", defaultValue: 25, step: 0.1 },
      { name: "period", label: "Pay period", type: "select", options: ["hourly", "monthly", "yearly"], defaultValue: "hourly" },
      { name: "hoursPerWeek", label: "Hours per week", type: "number", defaultValue: 40, step: 1 },
    ],
    compute: ({ amount, period, hoursPerWeek }) => {
      const value = parseNumber(amount);
      const hours = parseNumber(hoursPerWeek);
      let yearly = value;
      if (period === "hourly") yearly = value * hours * 52;
      if (period === "monthly") yearly = value * 12;
      return {
        summary: formatNumber(yearly),
        detail: "Estimated yearly income",
        rows: [["Yearly", formatNumber(yearly)], ["Monthly", formatNumber(yearly / 12)], ["Hourly", formatNumber(yearly / (hours * 52), 2)]],
      };
    },
  },
  {
    id: "rent-affordability",
    title: "Rent Affordability",
    short: "Rent",
    category: "Finance",
    description: "Estimate an affordable rent budget based on income.",
    fields: [
      { name: "monthlyIncome", label: "Monthly income", type: "number", defaultValue: 4200, step: 10 },
      { name: "budgetPercent", label: "Housing budget (%)", type: "number", defaultValue: 30, step: 0.1 },
    ],
    compute: ({ monthlyIncome, budgetPercent }) => {
      const income = parseNumber(monthlyIncome);
      const percent = parseNumber(budgetPercent);
      const rent = (income * percent) / 100;
      return {
        summary: formatNumber(rent),
        detail: "Suggested maximum monthly rent",
        rows: [["Affordable rent", formatNumber(rent)], ["Yearly housing budget", formatNumber(rent * 12)], ["Income left after rent", formatNumber(income - rent)]],
      };
    },
  },
  {
    id: "exchange-rate",
    title: "Exchange Rate Calculator",
    short: "Exchange",
    category: "Finance",
    description: "Convert an amount using a manual exchange rate you provide.",
    fields: [
      { name: "amount", label: "Amount", type: "number", defaultValue: 1000, step: 0.01 },
      { name: "rate", label: "Exchange rate", type: "number", defaultValue: 1.08, step: 0.0001 },
    ],
    compute: ({ amount, rate }) => {
      const base = parseNumber(amount);
      const exchange = parseNumber(rate);
      return {
        summary: formatNumber(base * exchange),
        detail: "Converted amount",
        rows: [["Converted", formatNumber(base * exchange)], ["Inverse rate", formatNumber(1 / exchange, 4)], ["Base amount", formatNumber(base)]],
      };
    },
  },
  {
    id: "emergency-fund",
    title: "Emergency Fund",
    short: "Emergency",
    category: "Finance",
    description: "Estimate an emergency fund target from monthly expenses.",
    fields: [
      { name: "monthlyExpenses", label: "Monthly expenses", type: "number", defaultValue: 1800, step: 10 },
      { name: "monthsCovered", label: "Months to cover", type: "number", defaultValue: 6, step: 1 },
      { name: "currentSavings", label: "Current emergency savings", type: "number", defaultValue: 3000, step: 10 },
    ],
    compute: ({ monthlyExpenses, monthsCovered, currentSavings }) => {
      const target = parseNumber(monthlyExpenses) * parseNumber(monthsCovered);
      const saved = parseNumber(currentSavings);
      return {
        summary: formatNumber(target),
        detail: "Recommended emergency fund target",
        rows: [["Target fund", formatNumber(target)], ["Still needed", formatNumber(Math.max(target - saved, 0))], ["Current progress", `${formatNumber((saved / target) * 100, 1)}%`]],
      };
    },
  },
  {
    id: "average",
    title: "Average Calculator",
    short: "Average",
    category: "Math",
    description: "Calculate average, sum, and count from comma-separated numbers.",
    fields: [
      { name: "values", label: "Numbers (comma separated)", type: "text", defaultValue: "12, 18, 20, 30, 45" },
    ],
    compute: ({ values }) => {
      const list = parseNumberList(values);
      if (!list.length) throw new Error("Enter at least one valid number.");
      const total = list.reduce((sum, value) => sum + value, 0);
      return {
        summary: formatNumber(total / list.length, 2),
        detail: "Arithmetic mean",
        rows: [["Average", formatNumber(total / list.length, 2)], ["Sum", formatNumber(total, 2)], ["Count", formatNumber(list.length, 0)]],
      };
    },
  },
  {
    id: "ratio",
    title: "Ratio Calculator",
    short: "Ratio",
    category: "Math",
    description: "Simplify ratios and see the multiplier between two values.",
    fields: [
      { name: "first", label: "First value", type: "number", defaultValue: 48, step: 1 },
      { name: "second", label: "Second value", type: "number", defaultValue: 18, step: 1 },
    ],
    compute: ({ first, second }) => {
      const a = parseNumber(first);
      const b = parseNumber(second);
      const divisor = gcd(a, b);
      return {
        summary: `${a / divisor}:${b / divisor}`,
        detail: "Simplified ratio",
        rows: [["Simplified", `${a / divisor}:${b / divisor}`], ["Decimal ratio", formatNumber(a / b, 4)], ["Greatest common divisor", formatNumber(divisor, 0)]],
      };
    },
  },
  {
    id: "quadratic",
    title: "Quadratic Solver",
    short: "Quadratic",
    category: "Math",
    description: "Solve quadratic equations and inspect the discriminant.",
    fields: [
      { name: "a", label: "a", type: "number", defaultValue: 1, step: 0.1 },
      { name: "b", label: "b", type: "number", defaultValue: -3, step: 0.1 },
      { name: "c", label: "c", type: "number", defaultValue: -10, step: 0.1 },
    ],
    compute: ({ a, b, c }) => {
      const av = parseNumber(a);
      const bv = parseNumber(b);
      const cv = parseNumber(c);
      const discriminant = bv ** 2 - 4 * av * cv;
      const rootA = (-bv + Math.sqrt(discriminant)) / (2 * av);
      const rootB = (-bv - Math.sqrt(discriminant)) / (2 * av);
      return {
        summary: discriminant >= 0 ? `${formatNumber(rootA, 3)}, ${formatNumber(rootB, 3)}` : "Complex roots",
        detail: "Quadratic roots",
        rows: [["Discriminant", formatNumber(discriminant, 3)], ["Root 1", discriminant >= 0 ? formatNumber(rootA, 3) : "Complex"], ["Root 2", discriminant >= 0 ? formatNumber(rootB, 3) : "Complex"]],
      };
    },
  },
  {
    id: "pythagorean",
    title: "Pythagorean Calculator",
    short: "Pythagorean",
    category: "Math",
    description: "Find the hypotenuse of a right triangle.",
    fields: [
      { name: "sideA", label: "Side A", type: "number", defaultValue: 3, step: 0.1 },
      { name: "sideB", label: "Side B", type: "number", defaultValue: 4, step: 0.1 },
    ],
    compute: ({ sideA, sideB }) => {
      const a = parseNumber(sideA);
      const b = parseNumber(sideB);
      const c = Math.sqrt(a ** 2 + b ** 2);
      return {
        summary: formatNumber(c, 3),
        detail: "Hypotenuse length",
        rows: [["Hypotenuse", formatNumber(c, 3)], ["Area", formatNumber((a * b) / 2, 3)], ["Perimeter", formatNumber(a + b + c, 3)]],
      };
    },
  },
  {
    id: "gcd-lcm",
    title: "GCD / LCM Calculator",
    short: "GCD / LCM",
    category: "Math",
    description: "Find the greatest common divisor and least common multiple.",
    fields: [
      { name: "first", label: "First integer", type: "number", defaultValue: 24, step: 1 },
      { name: "second", label: "Second integer", type: "number", defaultValue: 36, step: 1 },
    ],
    compute: ({ first, second }) => {
      const a = parseNumber(first);
      const b = parseNumber(second);
      const divisor = gcd(a, b);
      return {
        summary: formatNumber(divisor, 0),
        detail: "Greatest common divisor",
        rows: [["GCD", formatNumber(divisor, 0)], ["LCM", formatNumber(Math.abs((a * b) / divisor), 0)], ["Coprime", divisor === 1 ? "Yes" : "No"]],
      };
    },
  },
  {
    id: "prime-checker",
    title: "Prime Checker",
    short: "Prime",
    category: "Math",
    description: "Check whether a number is prime.",
    fields: [
      { name: "number", label: "Number", type: "number", defaultValue: 97, step: 1 },
    ],
    compute: ({ number }) => {
      const value = Math.floor(parseNumber(number));
      let prime = value > 1;
      for (let i = 2; i <= Math.sqrt(value); i += 1) {
        if (value % i === 0) {
          prime = false;
          break;
        }
      }
      return {
        summary: prime ? "Prime" : "Not prime",
        detail: `Checked ${value}`,
        rows: [["Result", prime ? "Prime" : "Composite"], ["Square root", formatNumber(Math.sqrt(value), 3)], ["Even or odd", value % 2 === 0 ? "Even" : "Odd"]],
      };
    },
  },
  {
    id: "stddev",
    title: "Standard Deviation",
    short: "Std Dev",
    category: "Math",
    description: "Calculate mean and population standard deviation from a list.",
    fields: [
      { name: "values", label: "Numbers (comma separated)", type: "text", defaultValue: "10, 12, 13, 16, 21" },
    ],
    compute: ({ values }) => {
      const list = parseNumberList(values);
      if (!list.length) throw new Error("Enter valid numbers separated by commas.");
      const mean = list.reduce((sum, value) => sum + value, 0) / list.length;
      const variance = list.reduce((sum, value) => sum + (value - mean) ** 2, 0) / list.length;
      return {
        summary: formatNumber(Math.sqrt(variance), 3),
        detail: "Population standard deviation",
        rows: [["Mean", formatNumber(mean, 3)], ["Variance", formatNumber(variance, 3)], ["Std. deviation", formatNumber(Math.sqrt(variance), 3)]],
      };
    },
  },
  {
    id: "ideal-weight",
    title: "Ideal Weight",
    short: "Ideal Weight",
    category: "Health",
    description: "Estimate ideal body weight using the Devine formula.",
    fields: [
      { name: "gender", label: "Gender", type: "select", options: ["male", "female"], defaultValue: "male" },
      { name: "heightCm", label: "Height (cm)", type: "number", defaultValue: 175, step: 0.1 },
    ],
    compute: ({ gender, heightCm }) => {
      const heightInches = parseNumber(heightCm) / 2.54;
      const base = gender === "male" ? 50 : 45.5;
      const ideal = base + Math.max(heightInches - 60, 0) * 2.3;
      return {
        summary: `${formatNumber(ideal, 1)} kg`,
        detail: "Estimated ideal weight",
        rows: [["Ideal weight", `${formatNumber(ideal, 1)} kg`], ["In pounds", `${formatNumber(ideal * 2.20462, 1)} lb`], ["Height", `${formatNumber(heightInches, 1)} in`]],
      };
    },
  },
  {
    id: "waist-height",
    title: "Waist to Height Ratio",
    short: "WHtR",
    category: "Health",
    description: "Use waist circumference and height to estimate health risk.",
    fields: [
      { name: "waist", label: "Waist (cm)", type: "number", defaultValue: 82, step: 0.1 },
      { name: "height", label: "Height (cm)", type: "number", defaultValue: 175, step: 0.1 },
    ],
    compute: ({ waist, height }) => {
      const ratio = parseNumber(waist) / parseNumber(height);
      let note = "Healthy range";
      if (ratio >= 0.5) note = "Increased risk";
      if (ratio >= 0.6) note = "High risk";
      return {
        summary: formatNumber(ratio, 3),
        detail: note,
        rows: [["Ratio", formatNumber(ratio, 3)], ["Status", note], ["Target waist", `${formatNumber(parseNumber(height) * 0.5, 1)} cm or less`]],
      };
    },
  },
  {
    id: "calories-burned",
    title: "Calories Burned",
    short: "Calories",
    category: "Health",
    description: "Estimate calories burned from body weight, MET, and duration.",
    fields: [
      { name: "weight", label: "Weight (kg)", type: "number", defaultValue: 72, step: 0.1 },
      { name: "met", label: "MET value", type: "number", defaultValue: 8, step: 0.1 },
      { name: "minutes", label: "Duration (minutes)", type: "number", defaultValue: 45, step: 1 },
    ],
    compute: ({ weight, met, minutes }) => {
      const calories = 0.0175 * parseNumber(met) * parseNumber(weight) * parseNumber(minutes);
      return {
        summary: formatNumber(calories, 0),
        detail: "Estimated calories burned",
        rows: [["Calories", formatNumber(calories, 0)], ["Per minute", formatNumber(calories / parseNumber(minutes), 2)], ["Per hour", formatNumber((calories / parseNumber(minutes)) * 60, 0)]],
      };
    },
  },
  {
    id: "macro-split",
    title: "Macro Split",
    short: "Macros",
    category: "Health",
    description: "Turn daily calories into protein, carbs, and fats targets.",
    fields: [
      { name: "calories", label: "Daily calories", type: "number", defaultValue: 2200, step: 10 },
      { name: "protein", label: "Protein (%)", type: "number", defaultValue: 30, step: 1 },
      { name: "carbs", label: "Carbs (%)", type: "number", defaultValue: 40, step: 1 },
      { name: "fats", label: "Fats (%)", type: "number", defaultValue: 30, step: 1 },
    ],
    compute: ({ calories, protein, carbs, fats }) => {
      const totalCalories = parseNumber(calories);
      const proteinPct = parseNumber(protein);
      const carbsPct = parseNumber(carbs);
      const fatsPct = parseNumber(fats);
      const totalPct = proteinPct + carbsPct + fatsPct;
      if (totalPct !== 100) throw new Error("Protein, carbs, and fats must add up to 100%.");
      return {
        summary: `${formatNumber((totalCalories * proteinPct) / 400, 0)}g protein`,
        detail: "Daily macro targets",
        rows: [["Protein", `${formatNumber((totalCalories * proteinPct) / 400, 0)} g`], ["Carbs", `${formatNumber((totalCalories * carbsPct) / 400, 0)} g`], ["Fats", `${formatNumber((totalCalories * fatsPct) / 900, 0)} g`]],
      };
    },
  },
  {
    id: "weight-converter",
    title: "Weight Converter",
    short: "Weight",
    category: "Conversion",
    description: "Convert between kilograms, grams, pounds, and ounces.",
    fields: [
      { name: "value", label: "Value", type: "number", defaultValue: 70, step: 0.01 },
      { name: "fromUnit", label: "From", type: "select", options: ["kilogram", "gram", "pound", "ounce"], defaultValue: "kilogram" },
      { name: "toUnit", label: "To", type: "select", options: ["kilogram", "gram", "pound", "ounce"], defaultValue: "pound" },
    ],
    compute: ({ value, fromUnit, toUnit }) => {
      const rates = { kilogram: 1, gram: 0.001, pound: 0.45359237, ounce: 0.0283495 };
      const kilograms = parseNumber(value) * rates[fromUnit];
      return {
        summary: formatNumber(kilograms / rates[toUnit], 4),
        detail: `${fromUnit} to ${toUnit}`,
        rows: [["Converted", formatNumber(kilograms / rates[toUnit], 4)], ["Kilograms", formatNumber(kilograms, 4)], ["Reference", `1 ${fromUnit} = ${formatNumber(rates[fromUnit] / rates[toUnit], 6)} ${toUnit}`]],
      };
    },
  },
  {
    id: "area-unit",
    title: "Area Unit Converter",
    short: "Area Unit",
    category: "Conversion",
    description: "Convert square meters, square feet, acres, and hectares.",
    fields: [
      { name: "value", label: "Value", type: "number", defaultValue: 120, step: 0.01 },
      { name: "fromUnit", label: "From", type: "select", options: ["sqm", "sqft", "acre", "hectare"], defaultValue: "sqm" },
      { name: "toUnit", label: "To", type: "select", options: ["sqm", "sqft", "acre", "hectare"], defaultValue: "sqft" },
    ],
    compute: ({ value, fromUnit, toUnit }) => {
      const rates = { sqm: 1, sqft: 0.092903, acre: 4046.856422, hectare: 10000 };
      const sqm = parseNumber(value) * rates[fromUnit];
      return {
        summary: formatNumber(sqm / rates[toUnit], 4),
        detail: `${fromUnit} to ${toUnit}`,
        rows: [["Converted", formatNumber(sqm / rates[toUnit], 4)], ["Square meters", formatNumber(sqm, 4)], ["Reference", `1 ${fromUnit} = ${formatNumber(rates[fromUnit] / rates[toUnit], 6)} ${toUnit}`]],
      };
    },
  },
  {
    id: "volume-unit",
    title: "Volume Unit Converter",
    short: "Volume Unit",
    category: "Conversion",
    description: "Convert liters, milliliters, gallons, and cubic meters.",
    fields: [
      { name: "value", label: "Value", type: "number", defaultValue: 10, step: 0.01 },
      { name: "fromUnit", label: "From", type: "select", options: ["liter", "milliliter", "gallon", "cubic meter"], defaultValue: "liter" },
      { name: "toUnit", label: "To", type: "select", options: ["liter", "milliliter", "gallon", "cubic meter"], defaultValue: "gallon" },
    ],
    compute: ({ value, fromUnit, toUnit }) => {
      const rates = { liter: 1, milliliter: 0.001, gallon: 3.78541, "cubic meter": 1000 };
      const liters = parseNumber(value) * rates[fromUnit];
      return {
        summary: formatNumber(liters / rates[toUnit], 4),
        detail: `${fromUnit} to ${toUnit}`,
        rows: [["Converted", formatNumber(liters / rates[toUnit], 4)], ["Liters", formatNumber(liters, 4)], ["Reference", `1 ${fromUnit} = ${formatNumber(rates[fromUnit] / rates[toUnit], 6)} ${toUnit}`]],
      };
    },
  },
  {
    id: "data-storage",
    title: "Data Storage Converter",
    short: "Storage",
    category: "Conversion",
    description: "Convert digital storage sizes between MB, GB, and TB.",
    fields: [
      { name: "value", label: "Value", type: "number", defaultValue: 512, step: 0.01 },
      { name: "fromUnit", label: "From", type: "select", options: ["MB", "GB", "TB"], defaultValue: "GB" },
      { name: "toUnit", label: "To", type: "select", options: ["MB", "GB", "TB"], defaultValue: "TB" },
    ],
    compute: ({ value, fromUnit, toUnit }) => {
      const rates = { MB: 1, GB: 1024, TB: 1048576 };
      const mb = parseNumber(value) * rates[fromUnit];
      return {
        summary: formatNumber(mb / rates[toUnit], 4),
        detail: `${fromUnit} to ${toUnit}`,
        rows: [["Converted", formatNumber(mb / rates[toUnit], 4)], ["Megabytes", formatNumber(mb, 2)], ["Gigabytes", formatNumber(mb / 1024, 4)]],
      };
    },
  },
  {
    id: "number-base",
    title: "Number Base Converter",
    short: "Base",
    category: "Conversion",
    description: "Convert values between binary, decimal, and hexadecimal.",
    fields: [
      { name: "value", label: "Value", type: "text", defaultValue: "255" },
      { name: "fromBase", label: "From", type: "select", options: ["2", "10", "16"], defaultValue: "10" },
    ],
    compute: ({ value, fromBase }) => {
      const decimal = parseInt(value, Number(fromBase));
      if (Number.isNaN(decimal)) throw new Error("Enter a valid value for the selected base.");
      return {
        summary: decimal.toString(10),
        detail: "Converted across common bases",
        rows: [["Binary", decimal.toString(2)], ["Decimal", decimal.toString(10)], ["Hexadecimal", decimal.toString(16).toUpperCase()]],
      };
    },
  },
  {
    id: "pace",
    title: "Pace Calculator",
    short: "Pace",
    category: "Conversion",
    description: "Convert a run or ride duration into pace and average speed.",
    fields: [
      { name: "distance", label: "Distance (km)", type: "number", defaultValue: 5, step: 0.01 },
      { name: "minutes", label: "Total time (minutes)", type: "number", defaultValue: 28, step: 0.1 },
    ],
    compute: ({ distance, minutes }) => {
      const km = parseNumber(distance);
      const totalMinutes = parseNumber(minutes);
      const pace = totalMinutes / km;
      return {
        summary: `${formatNumber(pace, 2)} min/km`,
        detail: "Average pace",
        rows: [["Pace", `${formatNumber(pace, 2)} min/km`], ["Speed", `${formatNumber(km / (totalMinutes / 60), 2)} km/h`], ["Time for 10 km", `${formatNumber(pace * 10, 1)} minutes`]],
      };
    },
  },
  {
    id: "ohms-law",
    title: "Ohm's Law Calculator",
    short: "Ohm",
    category: "Engineering",
    description: "Calculate voltage and power from current and resistance.",
    fields: [
      { name: "current", label: "Current (A)", type: "number", defaultValue: 2, step: 0.01 },
      { name: "resistance", label: "Resistance (ohm)", type: "number", defaultValue: 12, step: 0.01 },
    ],
    compute: ({ current, resistance }) => {
      const amps = parseNumber(current);
      const ohms = parseNumber(resistance);
      const voltage = amps * ohms;
      return {
        summary: `${formatNumber(voltage, 2)} V`,
        detail: "Voltage output",
        rows: [["Voltage", `${formatNumber(voltage, 2)} V`], ["Power", `${formatNumber(voltage * amps, 2)} W`], ["Resistance", `${formatNumber(ohms, 2)} ohm`]],
      };
    },
  },
  {
    id: "power",
    title: "Electrical Power",
    short: "Power",
    category: "Engineering",
    description: "Calculate wattage and energy use from voltage and current.",
    fields: [
      { name: "voltage", label: "Voltage (V)", type: "number", defaultValue: 230, step: 0.1 },
      { name: "current", label: "Current (A)", type: "number", defaultValue: 1.5, step: 0.01 },
      { name: "hours", label: "Hours used", type: "number", defaultValue: 5, step: 0.1 },
    ],
    compute: ({ voltage, current, hours }) => {
      const watts = parseNumber(voltage) * parseNumber(current);
      const kwh = (watts / 1000) * parseNumber(hours);
      return {
        summary: `${formatNumber(watts, 2)} W`,
        detail: "Electrical power draw",
        rows: [["Power", `${formatNumber(watts, 2)} W`], ["Energy", `${formatNumber(kwh, 3)} kWh`], ["Kilowatts", `${formatNumber(watts / 1000, 3)} kW`]],
      };
    },
  },
  {
    id: "ppi",
    title: "PPI Calculator",
    short: "PPI",
    category: "Engineering",
    description: "Estimate screen sharpness from resolution and display size.",
    fields: [
      { name: "widthPx", label: "Width (px)", type: "number", defaultValue: 2560, step: 1 },
      { name: "heightPx", label: "Height (px)", type: "number", defaultValue: 1440, step: 1 },
      { name: "inches", label: "Screen size (inches)", type: "number", defaultValue: 27, step: 0.1 },
    ],
    compute: ({ widthPx, heightPx, inches }) => {
      const diagonalPixels = Math.sqrt(parseNumber(widthPx) ** 2 + parseNumber(heightPx) ** 2);
      const ppi = diagonalPixels / parseNumber(inches);
      return {
        summary: formatNumber(ppi, 1),
        detail: "Pixels per inch",
        rows: [["PPI", formatNumber(ppi, 1)], ["Diagonal pixels", formatNumber(diagonalPixels, 0)], ["Pixel pitch", `${formatNumber(25.4 / ppi, 3)} mm`]],
      };
    },
  },
  {
    id: "aspect-ratio",
    title: "Aspect Ratio",
    short: "Aspect Ratio",
    category: "Engineering",
    description: "Simplify screen or image dimensions into a display ratio.",
    fields: [
      { name: "width", label: "Width", type: "number", defaultValue: 1920, step: 1 },
      { name: "height", label: "Height", type: "number", defaultValue: 1080, step: 1 },
    ],
    compute: ({ width, height }) => {
      const w = parseNumber(width);
      const h = parseNumber(height);
      const divisor = gcd(w, h);
      return {
        summary: `${w / divisor}:${h / divisor}`,
        detail: "Simplified aspect ratio",
        rows: [["Aspect ratio", `${w / divisor}:${h / divisor}`], ["Decimal", formatNumber(w / h, 4)], ["Diagonal", formatNumber(Math.sqrt(w ** 2 + h ** 2), 1)]],
      };
    },
  },
  {
    id: "download-time",
    title: "Download Time",
    short: "Download",
    category: "Utility",
    description: "Estimate download duration from file size and internet speed.",
    fields: [
      { name: "fileSizeGb", label: "File size (GB)", type: "number", defaultValue: 12, step: 0.01 },
      { name: "speedMbps", label: "Speed (Mbps)", type: "number", defaultValue: 80, step: 0.1 },
    ],
    compute: ({ fileSizeGb, speedMbps }) => {
      const seconds = (parseNumber(fileSizeGb) * 8192) / parseNumber(speedMbps);
      return {
        summary: `${formatNumber(seconds / 60, 1)} min`,
        detail: "Estimated download time",
        rows: [["Seconds", formatNumber(seconds, 0)], ["Minutes", formatNumber(seconds / 60, 1)], ["Hours", formatNumber(seconds / 3600, 2)]],
      };
    },
  },
  {
    id: "paint",
    title: "Paint Calculator",
    short: "Paint",
    category: "Utility",
    description: "Estimate paint needed for wall coverage.",
    fields: [
      { name: "wallWidth", label: "Wall width (m)", type: "number", defaultValue: 5, step: 0.1 },
      { name: "wallHeight", label: "Wall height (m)", type: "number", defaultValue: 2.8, step: 0.1 },
      { name: "coats", label: "Coats", type: "number", defaultValue: 2, step: 1 },
      { name: "coverage", label: "Coverage per liter (sqm)", type: "number", defaultValue: 10, step: 0.1 },
    ],
    compute: ({ wallWidth, wallHeight, coats, coverage }) => {
      const area = parseNumber(wallWidth) * parseNumber(wallHeight) * parseNumber(coats);
      const liters = area / parseNumber(coverage);
      return {
        summary: `${formatNumber(liters, 2)} L`,
        detail: "Estimated paint required",
        rows: [["Paintable area", `${formatNumber(area, 2)} sqm`], ["Liters required", `${formatNumber(liters, 2)} L`], ["5L cans", formatNumber(Math.ceil(liters / 5), 0)]],
      };
    },
  },
  {
    id: "tile",
    title: "Tile Calculator",
    short: "Tile",
    category: "Utility",
    description: "Estimate tile quantity from floor and tile dimensions.",
    fields: [
      { name: "floorLength", label: "Floor length (m)", type: "number", defaultValue: 6, step: 0.1 },
      { name: "floorWidth", label: "Floor width (m)", type: "number", defaultValue: 4, step: 0.1 },
      { name: "tileLength", label: "Tile length (cm)", type: "number", defaultValue: 60, step: 1 },
      { name: "tileWidth", label: "Tile width (cm)", type: "number", defaultValue: 60, step: 1 },
    ],
    compute: ({ floorLength, floorWidth, tileLength, tileWidth }) => {
      const floorArea = parseNumber(floorLength) * parseNumber(floorWidth);
      const tileArea = (parseNumber(tileLength) / 100) * (parseNumber(tileWidth) / 100);
      const tiles = Math.ceil(floorArea / tileArea);
      return {
        summary: formatNumber(tiles, 0),
        detail: "Tiles needed",
        rows: [["Floor area", `${formatNumber(floorArea, 2)} sqm`], ["Tile area", `${formatNumber(tileArea, 3)} sqm`], ["Tiles with 10% waste", formatNumber(Math.ceil(tiles * 1.1), 0)]],
      };
    },
  },
  {
    id: "concrete",
    title: "Concrete Calculator",
    short: "Concrete",
    category: "Utility",
    description: "Estimate concrete volume for slabs or foundations.",
    fields: [
      { name: "length", label: "Length (m)", type: "number", defaultValue: 5, step: 0.1 },
      { name: "width", label: "Width (m)", type: "number", defaultValue: 3, step: 0.1 },
      { name: "depth", label: "Depth (m)", type: "number", defaultValue: 0.12, step: 0.01 },
    ],
    compute: ({ length, width, depth }) => {
      const volume = parseNumber(length) * parseNumber(width) * parseNumber(depth);
      return {
        summary: `${formatNumber(volume, 3)} m3`,
        detail: "Concrete volume",
        rows: [["Volume", `${formatNumber(volume, 3)} m3`], ["Liters", `${formatNumber(volume * 1000, 0)} L`], ["80 lb bags", formatNumber(Math.ceil(volume / 0.017), 0)]],
      };
    },
  },
  {
    id: "hours-pay",
    title: "Work Hours & Pay",
    short: "Work Pay",
    category: "Utility",
    description: "Calculate gross pay from hourly rate and hours worked.",
    fields: [
      { name: "hourlyRate", label: "Hourly rate", type: "number", defaultValue: 22, step: 0.1 },
      { name: "hoursWorked", label: "Hours worked", type: "number", defaultValue: 42, step: 0.1 },
      { name: "overtimeRate", label: "Overtime multiplier", type: "number", defaultValue: 1.5, step: 0.1 },
    ],
    compute: ({ hourlyRate, hoursWorked, overtimeRate }) => {
      const rate = parseNumber(hourlyRate);
      const hours = parseNumber(hoursWorked);
      const regularHours = Math.min(hours, 40);
      const overtimeHours = Math.max(hours - 40, 0);
      const gross = regularHours * rate + overtimeHours * rate * parseNumber(overtimeRate);
      return {
        summary: formatNumber(gross),
        detail: "Gross estimated pay",
        rows: [["Regular pay", formatNumber(regularHours * rate)], ["Overtime pay", formatNumber(overtimeHours * rate * parseNumber(overtimeRate))], ["Total pay", formatNumber(gross)]],
      };
    },
  },
  {
    id: "body-surface-area",
    title: "Body Surface Area",
    short: "BSA",
    category: "Health",
    description: "Estimate body surface area using height and weight.",
    fields: [
      { name: "weight", label: "Weight (kg)", type: "number", defaultValue: 72, step: 0.1 },
      { name: "height", label: "Height (cm)", type: "number", defaultValue: 175, step: 0.1 },
    ],
    compute: ({ weight, height }) => {
      const bsa = Math.sqrt((parseNumber(weight) * parseNumber(height)) / 3600);
      return {
        summary: `${formatNumber(bsa, 2)} m2`,
        detail: "Estimated body surface area",
        rows: [["BSA", `${formatNumber(bsa, 2)} m2`], ["Weight", `${formatNumber(parseNumber(weight), 1)} kg`], ["Height", `${formatNumber(parseNumber(height), 1)} cm`]],
      };
    },
  },
  {
    id: "countdown",
    title: "Countdown Calculator",
    short: "Countdown",
    category: "Date & Time",
    description: "Count days, weeks, and months until a target date.",
    fields: [{ name: "targetDate", label: "Target date", type: "date" }],
    compute: ({ targetDate }) => {
      const target = new Date(targetDate);
      if (Number.isNaN(target.getTime())) throw new Error("Enter a valid target date.");
      const days = Math.max(Math.ceil((target.getTime() - Date.now()) / 86400000), 0);
      return { summary: `${days} days`, detail: "Time remaining", rows: [["Days", formatNumber(days, 0)], ["Weeks", formatNumber(days / 7, 1)], ["Months", formatNumber(days / 30.44, 1)]] };
    },
  },
  {
    id: "add-days-date",
    title: "Add Days to Date",
    short: "Add Days",
    category: "Date & Time",
    description: "Move forward from a date by a chosen number of days.",
    fields: [{ name: "startDate", label: "Start date", type: "date" }, { name: "days", label: "Days to add", type: "number", defaultValue: 30, step: 1 }],
    compute: ({ startDate, days }) => {
      const start = new Date(startDate);
      if (Number.isNaN(start.getTime())) throw new Error("Enter a valid start date.");
      start.setDate(start.getDate() + parseNumber(days));
      return { summary: start.toLocaleDateString(), detail: "Calculated future date", rows: [["Result date", start.toLocaleDateString()], ["Days added", formatNumber(parseNumber(days), 0)], ["Weekday", start.toLocaleDateString(undefined, { weekday: "long" })]] };
    },
  },
  {
    id: "next-birthday",
    title: "Next Birthday",
    short: "Birthday",
    category: "Date & Time",
    description: "Find the date and time remaining until the next birthday.",
    fields: [{ name: "birthDate", label: "Birth date", type: "date" }],
    compute: ({ birthDate }) => {
      const birth = new Date(birthDate);
      if (Number.isNaN(birth.getTime())) throw new Error("Enter a valid birth date.");
      const now = new Date();
      const next = new Date(now.getFullYear(), birth.getMonth(), birth.getDate());
      if (next < now) next.setFullYear(next.getFullYear() + 1);
      const days = Math.ceil((next.getTime() - now.getTime()) / 86400000);
      return { summary: `${days} days`, detail: "Until next birthday", rows: [["Next birthday", next.toLocaleDateString()], ["Days remaining", formatNumber(days, 0)], ["Turning age", formatNumber(next.getFullYear() - birth.getFullYear(), 0)]] };
    },
  },
  {
    id: "zodiac",
    title: "Zodiac Calculator",
    short: "Zodiac",
    category: "Date & Time",
    description: "Determine the western zodiac sign from a birth date.",
    fields: [{ name: "birthDate", label: "Birth date", type: "date" }],
    compute: ({ birthDate }) => {
      const date = new Date(birthDate);
      if (Number.isNaN(date.getTime())) throw new Error("Enter a valid birth date.");
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const signs = [
        [120, "Capricorn"], [218, "Aquarius"], [320, "Pisces"], [420, "Aries"], [521, "Taurus"], [621, "Gemini"],
        [722, "Cancer"], [823, "Leo"], [923, "Virgo"], [1023, "Libra"], [1122, "Scorpio"], [1222, "Sagittarius"], [1232, "Capricorn"],
      ];
      const value = month * 100 + day;
      const sign = signs.find(([limit]) => value < limit)[1];
      return { summary: sign, detail: "Western zodiac sign", rows: [["Sign", sign], ["Birth month", date.toLocaleDateString(undefined, { month: "long" })], ["Birth day", formatNumber(day, 0)]] };
    },
  },
  {
    id: "cagr",
    title: "CAGR Calculator",
    short: "CAGR",
    category: "Finance",
    description: "Calculate compound annual growth rate.",
    fields: [{ name: "startValue", label: "Beginning value", type: "number", defaultValue: 10000, step: 100 }, { name: "endValue", label: "Ending value", type: "number", defaultValue: 18000, step: 100 }, { name: "years", label: "Years", type: "number", defaultValue: 5, step: 1 }],
    compute: ({ startValue, endValue, years }) => {
      const cagr = ((parseNumber(endValue) / parseNumber(startValue)) ** (1 / parseNumber(years)) - 1) * 100;
      return { summary: `${formatNumber(cagr, 2)}%`, detail: "Compound annual growth rate", rows: [["CAGR", `${formatNumber(cagr, 2)}%`], ["Growth multiple", `${formatNumber(parseNumber(endValue) / parseNumber(startValue), 2)}x`], ["Years", formatNumber(parseNumber(years), 0)]] };
    },
  },
  {
    id: "inflation-impact",
    title: "Inflation Impact",
    short: "Inflation",
    category: "Finance",
    description: "Estimate future cost after inflation over time.",
    fields: [{ name: "currentCost", label: "Current cost", type: "number", defaultValue: 1000, step: 10 }, { name: "inflationRate", label: "Inflation (%)", type: "number", defaultValue: 5, step: 0.1 }, { name: "years", label: "Years", type: "number", defaultValue: 10, step: 1 }],
    compute: ({ currentCost, inflationRate, years }) => {
      const future = parseNumber(currentCost) * (1 + parseNumber(inflationRate) / 100) ** parseNumber(years);
      return { summary: formatNumber(future), detail: "Estimated future price", rows: [["Future cost", formatNumber(future)], ["Increase", formatNumber(future - parseNumber(currentCost))], ["Inflation rate", `${formatNumber(parseNumber(inflationRate), 2)}%`]] };
    },
  },
  {
    id: "annuity",
    title: "Annuity Payout",
    short: "Annuity",
    category: "Finance",
    description: "Estimate fixed periodic payout from a present value.",
    fields: [{ name: "presentValue", label: "Present value", type: "number", defaultValue: 100000, step: 1000 }, { name: "annualRate", label: "Annual rate (%)", type: "number", defaultValue: 6, step: 0.1 }, { name: "years", label: "Years", type: "number", defaultValue: 15, step: 1 }],
    compute: ({ presentValue, annualRate, years }) => {
      const pv = parseNumber(presentValue);
      const rate = parseNumber(annualRate) / 1200;
      const n = parseNumber(years) * 12;
      const payout = rate === 0 ? pv / n : (pv * rate) / (1 - (1 + rate) ** -n);
      return { summary: formatNumber(payout), detail: "Monthly payout", rows: [["Monthly payout", formatNumber(payout)], ["Annual payout", formatNumber(payout * 12)], ["Payment count", formatNumber(n, 0)]] };
    },
  },
  {
    id: "price-per-unit",
    title: "Price Per Unit",
    short: "Unit Price",
    category: "Finance",
    description: "Compare cost efficiency based on total price and quantity.",
    fields: [{ name: "price", label: "Total price", type: "number", defaultValue: 12.5, step: 0.01 }, { name: "quantity", label: "Quantity", type: "number", defaultValue: 750, step: 1 }],
    compute: ({ price, quantity }) => {
      const unit = parseNumber(price) / parseNumber(quantity);
      return { summary: formatNumber(unit, 4), detail: "Cost per unit", rows: [["Unit price", formatNumber(unit, 4)], ["Per 100 units", formatNumber(unit * 100, 2)], ["Quantity", formatNumber(parseNumber(quantity), 0)]] };
    },
  },
  {
    id: "budget-allocation",
    title: "Budget Allocation",
    short: "Budget",
    category: "Finance",
    description: "Split income into needs, wants, and savings.",
    fields: [{ name: "income", label: "Monthly income", type: "number", defaultValue: 4000, step: 10 }, { name: "needs", label: "Needs (%)", type: "number", defaultValue: 50, step: 1 }, { name: "wants", label: "Wants (%)", type: "number", defaultValue: 30, step: 1 }, { name: "savings", label: "Savings (%)", type: "number", defaultValue: 20, step: 1 }],
    compute: ({ income, needs, wants, savings }) => {
      const total = parseNumber(needs) + parseNumber(wants) + parseNumber(savings);
      if (total !== 100) throw new Error("Needs, wants, and savings must total 100%.");
      const monthly = parseNumber(income);
      return { summary: formatNumber(monthly), detail: "Monthly budget plan", rows: [["Needs", formatNumber((monthly * parseNumber(needs)) / 100)], ["Wants", formatNumber((monthly * parseNumber(wants)) / 100)], ["Savings", formatNumber((monthly * parseNumber(savings)) / 100)]] };
    },
  },
  {
    id: "debt-payoff",
    title: "Debt Payoff",
    short: "Debt",
    category: "Finance",
    description: "Estimate debt payoff time with fixed monthly payments.",
    fields: [{ name: "balance", label: "Balance", type: "number", defaultValue: 5000, step: 10 }, { name: "annualRate", label: "Annual interest (%)", type: "number", defaultValue: 18, step: 0.1 }, { name: "monthlyPayment", label: "Monthly payment", type: "number", defaultValue: 200, step: 1 }],
    compute: ({ balance, annualRate, monthlyPayment }) => {
      let remaining = parseNumber(balance);
      const monthlyRate = parseNumber(annualRate) / 1200;
      const payment = parseNumber(monthlyPayment);
      let months = 0;
      while (remaining > 0 && months < 1200) {
        remaining = remaining * (1 + monthlyRate) - payment;
        months += 1;
      }
      return { summary: `${months} months`, detail: "Estimated payoff timeline", rows: [["Months", formatNumber(months, 0)], ["Years", formatNumber(months / 12, 1)], ["Status", remaining <= 0 ? "Payoff achieved" : "Payment too low"] ] };
    },
  },
  {
    id: "paycheck",
    title: "Paycheck Calculator",
    short: "Paycheck",
    category: "Finance",
    description: "Estimate take-home pay after tax deductions.",
    fields: [{ name: "grossPay", label: "Gross pay", type: "number", defaultValue: 3000, step: 10 }, { name: "taxRate", label: "Tax (%)", type: "number", defaultValue: 18, step: 0.1 }, { name: "otherDeductions", label: "Other deductions", type: "number", defaultValue: 120, step: 1 }],
    compute: ({ grossPay, taxRate, otherDeductions }) => {
      const gross = parseNumber(grossPay);
      const tax = (gross * parseNumber(taxRate)) / 100;
      const net = gross - tax - parseNumber(otherDeductions);
      return { summary: formatNumber(net), detail: "Estimated take-home pay", rows: [["Tax withheld", formatNumber(tax)], ["Other deductions", formatNumber(parseNumber(otherDeductions))], ["Net pay", formatNumber(net)]] };
    },
  },
  {
    id: "sales-tax-reverse",
    title: "Reverse Tax Calculator",
    short: "Reverse Tax",
    category: "Finance",
    description: "Remove tax from a tax-inclusive price.",
    fields: [{ name: "inclusivePrice", label: "Tax-inclusive price", type: "number", defaultValue: 115, step: 0.01 }, { name: "taxRate", label: "Tax (%)", type: "number", defaultValue: 15, step: 0.1 }],
    compute: ({ inclusivePrice, taxRate }) => {
      const gross = parseNumber(inclusivePrice);
      const rate = parseNumber(taxRate) / 100;
      const base = gross / (1 + rate);
      return { summary: formatNumber(base), detail: "Tax-exclusive amount", rows: [["Base amount", formatNumber(base)], ["Tax amount", formatNumber(gross - base)], ["Inclusive total", formatNumber(gross)]] };
    },
  },
  {
    id: "median",
    title: "Median Calculator",
    short: "Median",
    category: "Math",
    description: "Find the median from a comma-separated list of numbers.",
    fields: [{ name: "values", label: "Numbers (comma separated)", type: "text", defaultValue: "2, 4, 8, 10, 12" }],
    compute: ({ values }) => {
      const list = parseNumberList(values).sort((a, b) => a - b);
      if (!list.length) throw new Error("Enter valid numbers separated by commas.");
      const mid = Math.floor(list.length / 2);
      const median = list.length % 2 ? list[mid] : (list[mid - 1] + list[mid]) / 2;
      return { summary: formatNumber(median, 2), detail: "Median value", rows: [["Median", formatNumber(median, 2)], ["Count", formatNumber(list.length, 0)], ["Min / Max", `${formatNumber(list[0], 2)} / ${formatNumber(list[list.length - 1], 2)}`]] };
    },
  },
  {
    id: "mode",
    title: "Mode Calculator",
    short: "Mode",
    category: "Math",
    description: "Find the most frequent value in a number list.",
    fields: [{ name: "values", label: "Numbers (comma separated)", type: "text", defaultValue: "2, 3, 3, 5, 7, 7, 7, 9" }],
    compute: ({ values }) => {
      const list = parseNumberList(values);
      if (!list.length) throw new Error("Enter valid numbers separated by commas.");
      const counts = new Map();
      list.forEach((value) => counts.set(value, (counts.get(value) || 0) + 1));
      const [modeValue, modeCount] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
      return { summary: formatNumber(modeValue, 2), detail: "Most frequent value", rows: [["Mode", formatNumber(modeValue, 2)], ["Frequency", formatNumber(modeCount, 0)], ["Unique values", formatNumber(counts.size, 0)]] };
    },
  },
  {
    id: "range",
    title: "Range Calculator",
    short: "Range",
    category: "Math",
    description: "Find the spread between min and max in a data set.",
    fields: [{ name: "values", label: "Numbers (comma separated)", type: "text", defaultValue: "4, 8, 15, 16, 23, 42" }],
    compute: ({ values }) => {
      const list = parseNumberList(values).sort((a, b) => a - b);
      if (!list.length) throw new Error("Enter valid numbers separated by commas.");
      return { summary: formatNumber(list[list.length - 1] - list[0], 2), detail: "Value range", rows: [["Range", formatNumber(list[list.length - 1] - list[0], 2)], ["Minimum", formatNumber(list[0], 2)], ["Maximum", formatNumber(list[list.length - 1], 2)]] };
    },
  },
  {
    id: "percentage-change",
    title: "Percentage Change",
    short: "Pct Change",
    category: "Math",
    description: "Measure percentage increase or decrease between two values.",
    fields: [{ name: "oldValue", label: "Old value", type: "number", defaultValue: 80, step: 0.01 }, { name: "newValue", label: "New value", type: "number", defaultValue: 104, step: 0.01 }],
    compute: ({ oldValue, newValue }) => {
      const change = ((parseNumber(newValue) - parseNumber(oldValue)) / parseNumber(oldValue)) * 100;
      return { summary: `${formatNumber(change, 2)}%`, detail: "Percentage change", rows: [["Change", `${formatNumber(change, 2)}%`], ["Difference", formatNumber(parseNumber(newValue) - parseNumber(oldValue), 2)], ["Direction", change >= 0 ? "Increase" : "Decrease"]] };
    },
  },
  {
    id: "permutation",
    title: "Permutation Calculator",
    short: "Permutation",
    category: "Math",
    description: "Calculate nPr permutations.",
    fields: [{ name: "n", label: "n", type: "number", defaultValue: 10, step: 1 }, { name: "r", label: "r", type: "number", defaultValue: 3, step: 1 }],
    compute: ({ n, r }) => {
      const nv = parseNumber(n);
      const rv = parseNumber(r);
      let result = 1;
      for (let i = 0; i < rv; i += 1) result *= nv - i;
      return { summary: formatNumber(result, 0), detail: "Permutation result", rows: [["nPr", formatNumber(result, 0)], ["n", formatNumber(nv, 0)], ["r", formatNumber(rv, 0)]] };
    },
  },
  {
    id: "combination",
    title: "Combination Calculator",
    short: "Combination",
    category: "Math",
    description: "Calculate nCr combinations.",
    fields: [{ name: "n", label: "n", type: "number", defaultValue: 10, step: 1 }, { name: "r", label: "r", type: "number", defaultValue: 3, step: 1 }],
    compute: ({ n, r }) => {
      const nv = parseNumber(n);
      const rv = parseNumber(r);
      let numerator = 1;
      let denominator = 1;
      for (let i = 1; i <= rv; i += 1) {
        numerator *= nv - (rv - i);
        denominator *= i;
      }
      const result = numerator / denominator;
      return { summary: formatNumber(result, 0), detail: "Combination result", rows: [["nCr", formatNumber(result, 0)], ["n", formatNumber(nv, 0)], ["r", formatNumber(rv, 0)]] };
    },
  },
  {
    id: "arithmetic-sequence",
    title: "Arithmetic Sequence",
    short: "Arithmetic Seq",
    category: "Math",
    description: "Find terms and sum of an arithmetic sequence.",
    fields: [{ name: "firstTerm", label: "First term", type: "number", defaultValue: 2, step: 0.1 }, { name: "difference", label: "Common difference", type: "number", defaultValue: 3, step: 0.1 }, { name: "terms", label: "Number of terms", type: "number", defaultValue: 12, step: 1 }],
    compute: ({ firstTerm, difference, terms }) => {
      const a = parseNumber(firstTerm);
      const d = parseNumber(difference);
      const n = parseNumber(terms);
      const nth = a + (n - 1) * d;
      const sum = (n / 2) * (2 * a + (n - 1) * d);
      return { summary: formatNumber(sum, 2), detail: "Arithmetic sequence sum", rows: [["Nth term", formatNumber(nth, 2)], ["Sum", formatNumber(sum, 2)], ["Difference", formatNumber(d, 2)]] };
    },
  },
  {
    id: "geometric-sequence",
    title: "Geometric Sequence",
    short: "Geometric Seq",
    category: "Math",
    description: "Find terms and sum of a geometric sequence.",
    fields: [{ name: "firstTerm", label: "First term", type: "number", defaultValue: 3, step: 0.1 }, { name: "ratio", label: "Common ratio", type: "number", defaultValue: 2, step: 0.1 }, { name: "terms", label: "Number of terms", type: "number", defaultValue: 8, step: 1 }],
    compute: ({ firstTerm, ratio, terms }) => {
      const a = parseNumber(firstTerm);
      const r = parseNumber(ratio);
      const n = parseNumber(terms);
      const nth = a * r ** (n - 1);
      const sum = r === 1 ? a * n : (a * (1 - r ** n)) / (1 - r);
      return { summary: formatNumber(sum, 2), detail: "Geometric sequence sum", rows: [["Nth term", formatNumber(nth, 2)], ["Sum", formatNumber(sum, 2)], ["Ratio", formatNumber(r, 2)]] };
    },
  },
  {
    id: "triangle-area",
    title: "Triangle Area",
    short: "Triangle",
    category: "Geometry",
    description: "Calculate triangle area from base and height.",
    fields: [{ name: "base", label: "Base", type: "number", defaultValue: 12, step: 0.1 }, { name: "height", label: "Height", type: "number", defaultValue: 8, step: 0.1 }],
    compute: ({ base, height }) => {
      const area = 0.5 * parseNumber(base) * parseNumber(height);
      return { summary: `${formatNumber(area, 2)} sq`, detail: "Triangle area", rows: [["Area", `${formatNumber(area, 2)} sq`], ["Base", formatNumber(parseNumber(base), 2)], ["Height", formatNumber(parseNumber(height), 2)]] };
    },
  },
  {
    id: "trapezoid-area",
    title: "Trapezoid Area",
    short: "Trapezoid",
    category: "Geometry",
    description: "Calculate trapezoid area from parallel sides and height.",
    fields: [{ name: "a", label: "Top base", type: "number", defaultValue: 10, step: 0.1 }, { name: "b", label: "Bottom base", type: "number", defaultValue: 16, step: 0.1 }, { name: "height", label: "Height", type: "number", defaultValue: 7, step: 0.1 }],
    compute: ({ a, b, height }) => {
      const area = ((parseNumber(a) + parseNumber(b)) * parseNumber(height)) / 2;
      return { summary: `${formatNumber(area, 2)} sq`, detail: "Trapezoid area", rows: [["Area", `${formatNumber(area, 2)} sq`], ["Average base", formatNumber((parseNumber(a) + parseNumber(b)) / 2, 2)], ["Height", formatNumber(parseNumber(height), 2)]] };
    },
  },
  {
    id: "parallelogram-area",
    title: "Parallelogram Area",
    short: "Parallelogram",
    category: "Geometry",
    description: "Calculate parallelogram area from base and height.",
    fields: [{ name: "base", label: "Base", type: "number", defaultValue: 14, step: 0.1 }, { name: "height", label: "Height", type: "number", defaultValue: 9, step: 0.1 }],
    compute: ({ base, height }) => {
      const area = parseNumber(base) * parseNumber(height);
      return { summary: `${formatNumber(area, 2)} sq`, detail: "Parallelogram area", rows: [["Area", `${formatNumber(area, 2)} sq`], ["Base", formatNumber(parseNumber(base), 2)], ["Height", formatNumber(parseNumber(height), 2)]] };
    },
  },
  {
    id: "hexagon-area",
    title: "Regular Hexagon Area",
    short: "Hexagon",
    category: "Geometry",
    description: "Calculate area of a regular hexagon from side length.",
    fields: [{ name: "side", label: "Side length", type: "number", defaultValue: 6, step: 0.1 }],
    compute: ({ side }) => {
      const s = parseNumber(side);
      const area = ((3 * Math.sqrt(3)) / 2) * s ** 2;
      return { summary: `${formatNumber(area, 2)} sq`, detail: "Regular hexagon area", rows: [["Area", `${formatNumber(area, 2)} sq`], ["Perimeter", formatNumber(s * 6, 2)], ["Side", formatNumber(s, 2)]] };
    },
  },
  {
    id: "cylinder-volume",
    title: "Cylinder Volume",
    short: "Cylinder",
    category: "Geometry",
    description: "Calculate cylinder volume from radius and height.",
    fields: [{ name: "radius", label: "Radius", type: "number", defaultValue: 4, step: 0.1 }, { name: "height", label: "Height", type: "number", defaultValue: 10, step: 0.1 }],
    compute: ({ radius, height }) => {
      const r = parseNumber(radius);
      const h = parseNumber(height);
      const volume = Math.PI * r ** 2 * h;
      return { summary: `${formatNumber(volume, 2)} cu`, detail: "Cylinder volume", rows: [["Volume", `${formatNumber(volume, 2)} cu`], ["Base area", `${formatNumber(Math.PI * r ** 2, 2)} sq`], ["Height", formatNumber(h, 2)]] };
    },
  },
  {
    id: "sphere-volume",
    title: "Sphere Volume",
    short: "Sphere",
    category: "Geometry",
    description: "Calculate sphere volume from radius.",
    fields: [{ name: "radius", label: "Radius", type: "number", defaultValue: 5, step: 0.1 }],
    compute: ({ radius }) => {
      const r = parseNumber(radius);
      const volume = (4 / 3) * Math.PI * r ** 3;
      return { summary: `${formatNumber(volume, 2)} cu`, detail: "Sphere volume", rows: [["Volume", `${formatNumber(volume, 2)} cu`], ["Surface area", `${formatNumber(4 * Math.PI * r ** 2, 2)} sq`], ["Radius", formatNumber(r, 2)]] };
    },
  },
  {
    id: "cone-volume",
    title: "Cone Volume",
    short: "Cone",
    category: "Geometry",
    description: "Calculate cone volume from radius and height.",
    fields: [{ name: "radius", label: "Radius", type: "number", defaultValue: 4, step: 0.1 }, { name: "height", label: "Height", type: "number", defaultValue: 9, step: 0.1 }],
    compute: ({ radius, height }) => {
      const r = parseNumber(radius);
      const h = parseNumber(height);
      const volume = (Math.PI * r ** 2 * h) / 3;
      return { summary: `${formatNumber(volume, 2)} cu`, detail: "Cone volume", rows: [["Volume", `${formatNumber(volume, 2)} cu`], ["Base area", `${formatNumber(Math.PI * r ** 2, 2)} sq`], ["Height", formatNumber(h, 2)]] };
    },
  },
  {
    id: "cube-volume",
    title: "Cube Volume",
    short: "Cube",
    category: "Geometry",
    description: "Calculate cube volume and surface area.",
    fields: [{ name: "side", label: "Side length", type: "number", defaultValue: 5, step: 0.1 }],
    compute: ({ side }) => {
      const s = parseNumber(side);
      const volume = s ** 3;
      return { summary: `${formatNumber(volume, 2)} cu`, detail: "Cube volume", rows: [["Volume", `${formatNumber(volume, 2)} cu`], ["Surface area", `${formatNumber(6 * s ** 2, 2)} sq`], ["Space diagonal", formatNumber(s * Math.sqrt(3), 2)]] };
    },
  },
  {
    id: "pressure-converter",
    title: "Pressure Converter",
    short: "Pressure",
    category: "Conversion",
    description: "Convert pressure between kilopascal, bar, and PSI.",
    fields: [{ name: "kpa", label: "Pressure (kPa)", type: "number", defaultValue: 101.325, step: 0.001 }],
    compute: ({ kpa }) => {
      const value = parseNumber(kpa);
      return { summary: `${formatNumber(value / 100, 3)} bar`, detail: "Pressure conversion", rows: [["Kilopascal", `${formatNumber(value, 3)} kPa`], ["Bar", `${formatNumber(value / 100, 3)} bar`], ["PSI", `${formatNumber(value * 0.145038, 3)} psi`]] };
    },
  },
  {
    id: "angle-converter",
    title: "Angle Converter",
    short: "Angle",
    category: "Conversion",
    description: "Convert angles from degrees to radians and gradians.",
    fields: [{ name: "degrees", label: "Degrees", type: "number", defaultValue: 45, step: 0.1 }],
    compute: ({ degrees }) => {
      const value = parseNumber(degrees);
      return { summary: `${formatNumber((value * Math.PI) / 180, 4)} rad`, detail: "Angle conversion", rows: [["Degrees", `${formatNumber(value, 2)} deg`], ["Radians", `${formatNumber((value * Math.PI) / 180, 4)} rad`], ["Gradians", `${formatNumber(value * (10 / 9), 2)} gon`]] };
    },
  },
  {
    id: "voltage-divider",
    title: "Voltage Divider",
    short: "Divider",
    category: "Engineering",
    description: "Calculate output voltage in a resistor divider circuit.",
    fields: [{ name: "vin", label: "Input voltage", type: "number", defaultValue: 12, step: 0.1 }, { name: "r1", label: "R1 (ohms)", type: "number", defaultValue: 1000, step: 1 }, { name: "r2", label: "R2 (ohms)", type: "number", defaultValue: 2200, step: 1 }],
    compute: ({ vin, r1, r2 }) => {
      const output = parseNumber(vin) * (parseNumber(r2) / (parseNumber(r1) + parseNumber(r2)));
      return { summary: `${formatNumber(output, 2)} V`, detail: "Divider output voltage", rows: [["Output voltage", `${formatNumber(output, 2)} V`], ["Divider ratio", formatNumber(parseNumber(r2) / (parseNumber(r1) + parseNumber(r2)), 3)], ["Input voltage", `${formatNumber(parseNumber(vin), 2)} V`]] };
    },
  },
  {
    id: "resistor-series",
    title: "Resistors in Series",
    short: "Series R",
    category: "Engineering",
    description: "Add resistor values connected in series.",
    fields: [{ name: "values", label: "Resistors (comma separated ohms)", type: "text", defaultValue: "100, 220, 330" }],
    compute: ({ values }) => {
      const list = parseNumberList(values);
      if (!list.length) throw new Error("Enter resistor values separated by commas.");
      const total = list.reduce((sum, value) => sum + value, 0);
      return { summary: `${formatNumber(total, 2)} ohm`, detail: "Equivalent series resistance", rows: [["Total resistance", `${formatNumber(total, 2)} ohm`], ["Component count", formatNumber(list.length, 0)], ["Average", `${formatNumber(total / list.length, 2)} ohm`]] };
    },
  },
  {
    id: "resistor-parallel",
    title: "Resistors in Parallel",
    short: "Parallel R",
    category: "Engineering",
    description: "Calculate equivalent resistance for parallel resistors.",
    fields: [{ name: "values", label: "Resistors (comma separated ohms)", type: "text", defaultValue: "100, 220, 330" }],
    compute: ({ values }) => {
      const list = parseNumberList(values).filter((value) => value > 0);
      if (!list.length) throw new Error("Enter positive resistor values separated by commas.");
      const reciprocal = list.reduce((sum, value) => sum + (1 / value), 0);
      const total = 1 / reciprocal;
      return { summary: `${formatNumber(total, 2)} ohm`, detail: "Equivalent parallel resistance", rows: [["Total resistance", `${formatNumber(total, 2)} ohm`], ["Component count", formatNumber(list.length, 0)], ["Smallest resistor", `${formatNumber(Math.min(...list), 2)} ohm`]] };
    },
  },
  {
    id: "battery-runtime",
    title: "Battery Runtime",
    short: "Battery",
    category: "Engineering",
    description: "Estimate battery runtime from capacity and current draw.",
    fields: [{ name: "capacityMah", label: "Capacity (mAh)", type: "number", defaultValue: 5000, step: 1 }, { name: "loadMa", label: "Load current (mA)", type: "number", defaultValue: 650, step: 1 }, { name: "efficiency", label: "Efficiency (%)", type: "number", defaultValue: 90, step: 1 }],
    compute: ({ capacityMah, loadMa, efficiency }) => {
      const runtime = (parseNumber(capacityMah) * (parseNumber(efficiency) / 100)) / parseNumber(loadMa);
      return { summary: `${formatNumber(runtime, 2)} hr`, detail: "Estimated battery runtime", rows: [["Hours", `${formatNumber(runtime, 2)} hr`], ["Minutes", `${formatNumber(runtime * 60, 0)} min`], ["Efficiency", `${formatNumber(parseNumber(efficiency), 0)}%`]] };
    },
  },
  {
    id: "heart-rate-zone",
    title: "Heart Rate Zone",
    short: "HR Zone",
    category: "Health",
    description: "Estimate training heart-rate ranges using age and resting heart rate.",
    fields: [{ name: "age", label: "Age", type: "number", defaultValue: 28, step: 1 }, { name: "resting", label: "Resting heart rate", type: "number", defaultValue: 65, step: 1 }],
    compute: ({ age, resting }) => {
      const max = 220 - parseNumber(age);
      const reserve = max - parseNumber(resting);
      const moderateLow = parseNumber(resting) + reserve * 0.5;
      const moderateHigh = parseNumber(resting) + reserve * 0.7;
      const intenseHigh = parseNumber(resting) + reserve * 0.85;
      return { summary: `${formatNumber(moderateLow, 0)}-${formatNumber(moderateHigh, 0)} bpm`, detail: "Moderate training zone", rows: [["Estimated max", `${formatNumber(max, 0)} bpm`], ["Moderate zone", `${formatNumber(moderateLow, 0)}-${formatNumber(moderateHigh, 0)} bpm`], ["High zone ceiling", `${formatNumber(intenseHigh, 0)} bpm`]] };
    },
  },
  {
    id: "one-rep-max",
    title: "One Rep Max",
    short: "1RM",
    category: "Health",
    description: "Estimate one-rep max from lifted weight and repetitions.",
    fields: [{ name: "weight", label: "Weight lifted", type: "number", defaultValue: 80, step: 0.1 }, { name: "reps", label: "Repetitions", type: "number", defaultValue: 8, step: 1 }],
    compute: ({ weight, reps }) => {
      const estimate = parseNumber(weight) * (1 + parseNumber(reps) / 30);
      return { summary: `${formatNumber(estimate, 1)} kg`, detail: "Estimated one-rep max", rows: [["Estimated 1RM", `${formatNumber(estimate, 1)} kg`], ["85% working set", `${formatNumber(estimate * 0.85, 1)} kg`], ["75% working set", `${formatNumber(estimate * 0.75, 1)} kg`]] };
    },
  },
  {
    id: "step-length",
    title: "Step Length",
    short: "Step Length",
    category: "Health",
    description: "Estimate average step length from distance and steps.",
    fields: [{ name: "distanceKm", label: "Distance (km)", type: "number", defaultValue: 5, step: 0.01 }, { name: "steps", label: "Steps", type: "number", defaultValue: 6500, step: 1 }],
    compute: ({ distanceKm, steps }) => {
      const stepLength = (parseNumber(distanceKm) * 1000) / parseNumber(steps);
      return { summary: `${formatNumber(stepLength, 2)} m`, detail: "Average step length", rows: [["Step length", `${formatNumber(stepLength, 2)} m`], ["Step length", `${formatNumber(stepLength * 100, 1)} cm`], ["Stride length", `${formatNumber(stepLength * 2, 2)} m`]] };
    },
  },
  {
    id: "bmi-prime",
    title: "BMI Prime",
    short: "BMI Prime",
    category: "Health",
    description: "Measure BMI relative to the upper normal BMI threshold.",
    fields: [{ name: "weight", label: "Weight (kg)", type: "number", defaultValue: 72, step: 0.1 }, { name: "height", label: "Height (cm)", type: "number", defaultValue: 175, step: 0.1 }],
    compute: ({ weight, height }) => {
      const bmi = parseNumber(weight) / (parseNumber(height) / 100) ** 2;
      const prime = bmi / 25;
      return { summary: formatNumber(prime, 2), detail: "BMI prime score", rows: [["BMI prime", formatNumber(prime, 2)], ["BMI", formatNumber(bmi, 2)], ["Status", prime <= 1 ? "Within reference range" : "Above reference range"]] };
    },
  },
  {
    id: "lean-body-mass",
    title: "Lean Body Mass",
    short: "LBM",
    category: "Health",
    description: "Estimate lean body mass using body fat percentage.",
    fields: [{ name: "weight", label: "Weight (kg)", type: "number", defaultValue: 78, step: 0.1 }, { name: "bodyFat", label: "Body fat (%)", type: "number", defaultValue: 18, step: 0.1 }],
    compute: ({ weight, bodyFat }) => {
      const total = parseNumber(weight);
      const fat = parseNumber(bodyFat) / 100;
      const lbm = total * (1 - fat);
      return { summary: `${formatNumber(lbm, 1)} kg`, detail: "Estimated lean body mass", rows: [["Lean mass", `${formatNumber(lbm, 1)} kg`], ["Fat mass", `${formatNumber(total - lbm, 1)} kg`], ["Body fat", `${formatNumber(parseNumber(bodyFat), 1)}%`]] };
    },
  },
  {
    id: "calorie-deficit",
    title: "Calorie Deficit",
    short: "Deficit",
    category: "Health",
    description: "Estimate daily calorie target for a weekly fat-loss goal.",
    fields: [{ name: "maintenance", label: "Maintenance calories", type: "number", defaultValue: 2400, step: 1 }, { name: "weeklyLoss", label: "Target weekly loss (kg)", type: "number", defaultValue: 0.5, step: 0.1 }],
    compute: ({ maintenance, weeklyLoss }) => {
      const dailyDeficit = (parseNumber(weeklyLoss) * 7700) / 7;
      const target = parseNumber(maintenance) - dailyDeficit;
      return { summary: `${formatNumber(target, 0)} kcal`, detail: "Suggested daily calorie target", rows: [["Daily target", `${formatNumber(target, 0)} kcal`], ["Daily deficit", `${formatNumber(dailyDeficit, 0)} kcal`], ["Weekly deficit", `${formatNumber(dailyDeficit * 7, 0)} kcal`]] };
    },
  },
  {
    id: "protein-intake",
    title: "Protein Intake",
    short: "Protein",
    category: "Health",
    description: "Estimate daily protein target from body weight and goal.",
    fields: [{ name: "weight", label: "Weight (kg)", type: "number", defaultValue: 72, step: 0.1 }, { name: "multiplier", label: "Protein multiplier (g/kg)", type: "number", defaultValue: 1.8, step: 0.1 }],
    compute: ({ weight, multiplier }) => {
      const grams = parseNumber(weight) * parseNumber(multiplier);
      return { summary: `${formatNumber(grams, 0)} g`, detail: "Daily protein target", rows: [["Protein target", `${formatNumber(grams, 0)} g`], ["Per meal (4 meals)", `${formatNumber(grams / 4, 0)} g`], ["Body weight", `${formatNumber(parseNumber(weight), 1)} kg`]] };
    },
  },
  {
    id: "body-fat-estimate",
    title: "Body Fat Estimate",
    short: "Body Fat",
    category: "Health",
    description: "Estimate body fat percentage from BMI, age, and sex.",
    fields: [{ name: "bmi", label: "BMI", type: "number", defaultValue: 24.2, step: 0.1 }, { name: "age", label: "Age", type: "number", defaultValue: 30, step: 1 }, { name: "sex", label: "Sex", type: "select", defaultValue: "male", options: [{ value: "male", label: "Male" }, { value: "female", label: "Female" }] }],
    compute: ({ bmi, age, sex }) => {
      const sexFactor = sex === "male" ? 1 : 0;
      const estimate = (1.2 * parseNumber(bmi)) + (0.23 * parseNumber(age)) - (10.8 * sexFactor) - 5.4;
      return { summary: `${formatNumber(estimate, 1)}%`, detail: "Estimated body fat", rows: [["Body fat", `${formatNumber(estimate, 1)}%`], ["BMI", formatNumber(parseNumber(bmi), 1)], ["Sex model", sex === "male" ? "Male formula" : "Female formula"]] };
    },
  },
  {
    id: "pace-split",
    title: "Pace Split Calculator",
    short: "Pace Split",
    category: "Sports",
    description: "Estimate split time from race distance and finish time.",
    fields: [{ name: "distanceKm", label: "Distance (km)", type: "number", defaultValue: 10, step: 0.01 }, { name: "finishMinutes", label: "Finish time (minutes)", type: "number", defaultValue: 52, step: 0.1 }],
    compute: ({ distanceKm, finishMinutes }) => {
      const pace = parseNumber(finishMinutes) / parseNumber(distanceKm);
      return { summary: `${formatNumber(pace, 2)} min/km`, detail: "Average race pace", rows: [["Pace", `${formatNumber(pace, 2)} min/km`], ["5K split", `${formatNumber(pace * 5, 1)} min`], ["1 mile pace", `${formatNumber(pace * 1.60934, 2)} min`]] };
    },
  },
  {
    id: "target-heart-rate",
    title: "Target Heart Rate",
    short: "Target HR",
    category: "Sports",
    description: "Calculate target heart rate at a chosen intensity.",
    fields: [{ name: "age", label: "Age", type: "number", defaultValue: 28, step: 1 }, { name: "intensity", label: "Intensity (%)", type: "number", defaultValue: 70, step: 1 }],
    compute: ({ age, intensity }) => {
      const max = 220 - parseNumber(age);
      const target = max * (parseNumber(intensity) / 100);
      return { summary: `${formatNumber(target, 0)} bpm`, detail: "Target training heart rate", rows: [["Target heart rate", `${formatNumber(target, 0)} bpm`], ["Max heart rate", `${formatNumber(max, 0)} bpm`], ["Intensity", `${formatNumber(parseNumber(intensity), 0)}%`]] };
    },
  },
  ];

const categoryCounts = calculatorDefinitions.reduce((acc, item) => {
  acc[item.category] = (acc[item.category] || 0) + 1;
  return acc;
}, {});

function getCalculatorById(id) {
  return calculatorDefinitions.find((calculator) => calculator.id === id);
}

function getCalculatorState(id) {
  if (!sharedState.calculatorStates[id]) {
    sharedState.calculatorStates[id] = {};
  }
  return sharedState.calculatorStates[id];
}

function renderNavigation() {
  const query = sharedState.searchQuery.trim().toLowerCase();
  const visibleCalculators = calculatorDefinitions.filter((calculator) => {
    if (!query) {
      return true;
    }
    const haystack = [
      calculator.title,
      calculator.short,
      calculator.category,
      calculator.description,
    ].join(" ").toLowerCase();
    return haystack.includes(query);
  });

  calculatorNav.innerHTML = "";
  calculatorCount.textContent = query
    ? `${visibleCalculators.length}/${calculatorDefinitions.length} modes`
    : `${calculatorDefinitions.length} modes`;
  metricModes.textContent = String(calculatorDefinitions.length);
  metricCategories.textContent = String(Object.keys(categoryCounts).length);
  animateHeroToolsCount(calculatorDefinitions.length);

  if (!visibleCalculators.length) {
    calculatorNav.innerHTML = '<div class="empty-state">No calculator matched your search.</div>';
    return;
  }

  visibleCalculators.forEach((calculator) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `nav-button${calculator.id === sharedState.activeCalculatorId ? " active" : ""}`;
    button.innerHTML = `<strong>${calculator.short}</strong><span>${calculator.category}</span>`;
    button.addEventListener("click", () => {
      sharedState.activeCalculatorId = calculator.id;
      renderNavigation();
      renderActiveCalculator();
      navPanel.classList.remove("open");
    });
    calculatorNav.appendChild(button);
  });
}

function renderCategories() {
  categoryList.innerHTML = "";
  Object.entries(categoryCounts).forEach(([category, count]) => {
    const span = document.createElement("span");
    span.className = "category-chip";
    span.textContent = `${category} | ${count}`;
    categoryList.appendChild(span);
  });
}

function formatThemeName(theme) {
  return theme.charAt(0).toUpperCase() + theme.slice(1);
}

function setTheme(theme) {
  sharedState.activeTheme = theme;
  document.body.dataset.theme = theme;
  themeSelect.value = theme;
  metricTheme.textContent = formatThemeName(theme);
  renderToolbar(getCalculatorById(sharedState.activeCalculatorId));
}

function setUtilityTab(container, tab) {
  sharedState.activeUtilityTab = tab;
  container.querySelectorAll("[data-utility-tab]").forEach((button) => {
    button.classList.toggle("active", button.dataset.utilityTab === tab);
  });
  container.querySelectorAll("[data-utility-panel]").forEach((panel) => {
    panel.hidden = panel.dataset.utilityPanel !== tab;
  });
}

function createUtilityPanel(workspaceMarkup) {
  const panel = document.createElement("aside");
  panel.className = "result-card utility-panel";
  panel.innerHTML = `
    <div class="support-tabs">
      <button class="support-tab" type="button" data-utility-tab="workspace">Workspace</button>
      <button class="support-tab" type="button" data-utility-tab="activity">Recent Activity</button>
    </div>
    <section class="tab-panel" data-utility-panel="workspace">
      <div data-workspace-slot>${workspaceMarkup}</div>
    </section>
    <section class="tab-panel" data-utility-panel="activity">
      <div class="panel-header">
        <h3>Recent Activity</h3>
        <button class="ghost-button" type="button" data-clear-activity>Clear</button>
      </div>
      <div class="activity-feed" data-activity-feed>${getActivityMarkup()}</div>
    </section>
  `;

  panel.querySelectorAll("[data-utility-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      setUtilityTab(panel, button.dataset.utilityTab);
    });
  });

  panel.querySelector("[data-clear-activity]").addEventListener("click", () => {
    sharedState.activity = [];
    renderActivity();
  });

  setUtilityTab(panel, sharedState.activeUtilityTab);
  return panel;
}

function updateFullscreenButton() {
  const isFullscreen = document.fullscreenElement === calculatorStage;
  calculatorStage.classList.toggle("stage-fullscreen", isFullscreen);
  stageFullscreenButton.textContent = isFullscreen ? "Exit Fullscreen" : "Fullscreen";
}

async function toggleCalculatorFullscreen() {
  if (document.fullscreenElement === calculatorStage) {
    await document.exitFullscreen();
    return;
  }

  if (document.fullscreenElement) {
    await document.exitFullscreen();
  }

  await calculatorStage.requestFullscreen();
}

function createField(field, calculatorId) {
  const wrapper = document.createElement("div");
  wrapper.className = "field";
  const label = document.createElement("label");
  const fieldId = `${calculatorId}-${field.name}`;
  label.setAttribute("for", fieldId);
  label.textContent = field.label;
  wrapper.appendChild(label);

  let control;
  if (field.type === "select") {
    control = document.createElement("select");
    field.options.forEach((optionValue) => {
      const option = document.createElement("option");
      option.value = optionValue;
      option.textContent = optionValue;
      control.appendChild(option);
    });
  } else {
    control = document.createElement("input");
    control.type = field.type;
    if (field.min !== undefined) control.min = String(field.min);
    if (field.max !== undefined) control.max = String(field.max);
    if (field.step !== undefined) control.step = String(field.step);
  }
  control.id = fieldId;
  control.name = field.name;
  if (field.defaultValue !== undefined) control.value = String(field.defaultValue);
  wrapper.appendChild(control);
  return wrapper;
}

function createResultMarkup(result) {
  return `
    <div class="calculator-badge">Ready</div>
    <h3>${result.summary}</h3>
    <p class="subtle-copy">${result.detail}</p>
    <div class="result-grid">
      ${result.rows.map(([label, value]) => `
        <div class="result-row">
          <span class="result-label">${label}</span>
          <strong class="result-value">${value}</strong>
        </div>
      `).join("")}
    </div>
  `;
}

function renderFormCalculator(calculator) {
  const calculatorState = getCalculatorState(calculator.id);
  const wrapper = document.createElement("div");
  wrapper.className = "dual-column-layout";

  const formCard = document.createElement("section");
  formCard.className = "calc-card";
  formCard.innerHTML = `
    <div class="calculator-badge">${calculator.category}</div>
    <h3>${calculator.title}</h3>
    <p class="subtle-copy">${calculator.description}</p>
  `;

  const form = document.createElement("form");
  const grid = document.createElement("div");
  grid.className = "form-grid";
  calculator.fields.forEach((field) => grid.appendChild(createField(field, calculator.id)));
  form.appendChild(grid);
  form.insertAdjacentHTML("beforeend", `
    <div class="form-actions">
      <button class="form-button primary" type="submit">Calculate</button>
      <button class="form-button secondary" type="reset">Reset</button>
    </div>
  `);
  formCard.appendChild(form);

  const initialWorkspaceMarkup = calculatorState.lastResult
    ? createResultMarkup(calculatorState.lastResult)
    : `
      <div class="calculator-badge">Result</div>
      <h3>Waiting for input</h3>
      <p class="subtle-copy">Fill out the fields and run the calculator to see detailed results.</p>
      <div class="note-box">Each calculator shows a summary plus supporting values.</div>
    `;
  const utilityPanel = createUtilityPanel(initialWorkspaceMarkup);
  const workspaceSlot = utilityPanel.querySelector("[data-workspace-slot]");

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    try {
      const values = Object.fromEntries(new FormData(form).entries());
      const result = calculator.compute(values);
      calculatorState.lastResult = result;
      workspaceSlot.innerHTML = createResultMarkup(result);
      addActivity(calculator.short, result.summary, result.detail);
    } catch (error) {
      workspaceSlot.innerHTML = `<div class="calculator-badge">Result</div><h3>Error</h3><p class="subtle-copy">${error.message}</p>`;
    }
  });

  form.addEventListener("reset", () => {
    window.setTimeout(() => {
      delete calculatorState.lastResult;
      renderActiveCalculator();
    }, 0);
  });

  wrapper.append(formCard, utilityPanel);
  return wrapper;
}

function baseCalcState(id) {
  const state = getCalculatorState(id);
  if (!state.display) {
    state.display = "0";
    state.expression = "";
    state.previousValue = null;
    state.operator = null;
    state.waiting = false;
    state.memory = 0;
    state.history = [];
  }
  return state;
}

function addCalcHistory(state, expression, result) {
  state.history.unshift({ expression, result });
  state.history = state.history.slice(0, 8);
}

function renderCalcHistory(state) {
  if (!state.history.length) {
    return '<p class="empty-state">Recent calculator operations appear here.</p>';
  }
  return state.history.map((entry, index) => `
    <article class="history-item">
      <button type="button" data-history-index="${index}">
        <span class="history-expression">${entry.expression}</span>
        <span class="history-result">${entry.result}</span>
      </button>
    </article>
  `).join("");
}

function calculateBinary(first, second, operator) {
  switch (operator) {
    case "+": return first + second;
    case "-": return first - second;
    case "*": return first * second;
    case "/": return second === 0 ? NaN : first / second;
    case "^": return first ** second;
    default: return second;
  }
}

function renderPadCalculator(calculator) {
  const state = baseCalcState(calculator.id);
  const scientific = calculator.mode === "scientific";
  const wrapper = document.createElement("div");
  wrapper.className = "calculator-layout";
  const calcCard = document.createElement("section");
  calcCard.className = "calc-card";

  calcCard.innerHTML = `
    <div class="calculator-badge">${calculator.category}</div>
    <h3>${calculator.title}</h3>
    <p class="subtle-copy">${calculator.description}</p>
    <div class="calculator-display">
      <div class="panel-header">
        <span class="result-label">Memory: <strong class="mono">${formatPrecise(state.memory)}</strong></span>
        <button type="button" class="ghost-button" data-action="clear-history">Clear history</button>
      </div>
      <div class="expression-line">${state.expression || "&nbsp;"}</div>
      <div class="display-line">${state.display}</div>
    </div>
    <div class="keypad-shell">
      ${scientific ? `
        <div class="science-strip">
          <button type="button" class="key-utility" data-action="function" data-value="log">log</button>
          <button type="button" class="key-utility" data-action="function" data-value="ln">ln</button>
          <button type="button" class="key-utility" data-action="function" data-value="factorial">n!</button>
          <button type="button" class="key-operator" data-action="operator" data-value="^">x^y</button>
          <button type="button" class="key-utility" data-action="clear-history">HIS</button>
        </div>
      ` : ""}
      <div class="keypad">
        <button type="button" class="key-dark" data-action="memory" data-value="mc">MC</button>
        <button type="button" class="key-dark" data-action="memory" data-value="mr">MR</button>
        <button type="button" class="key-dark" data-action="memory" data-value="mplus">M+</button>
        <button type="button" class="key-dark" data-action="memory" data-value="mminus">M-</button>
        <button type="button" class="key-dark" data-action="clear-entry">CE</button>

        <button type="button" class="key-dark" data-action="function" data-value="percent">%</button>
        <button type="button" class="key-dark" data-action="function" data-value="square">x^2</button>
        <button type="button" class="key-dark" data-action="function" data-value="sqrt">sqrt</button>
        <button type="button" class="key-dark" data-action="function" data-value="reciprocal">1/x</button>
        <button type="button" class="key-operator" data-action="operator" data-value="/">/</button>

        <button type="button" class="key-dark" data-action="function" data-value="sin">sin</button>
        <button type="button" class="key-dark" data-action="function" data-value="cos">cos</button>
        <button type="button" class="key-dark" data-action="function" data-value="tan">tan</button>
        <button type="button" class="key-dark" data-action="backspace">DEL</button>
        <button type="button" class="key-operator" data-action="operator" data-value="*">*</button>

        <button type="button" class="key-dark" data-action="digit" data-value="7">7</button>
        <button type="button" class="key-dark" data-action="digit" data-value="8">8</button>
        <button type="button" class="key-dark" data-action="digit" data-value="9">9</button>
        <button type="button" class="key-dark" data-action="function" data-value="sign">+/-</button>
        <button type="button" class="key-operator" data-action="operator" data-value="-">-</button>

        <button type="button" class="key-dark" data-action="digit" data-value="4">4</button>
        <button type="button" class="key-dark" data-action="digit" data-value="5">5</button>
        <button type="button" class="key-dark" data-action="digit" data-value="6">6</button>
        <button type="button" class="key-dark" data-action="constant" data-value="PI">PI</button>
        <button type="button" class="key-operator" data-action="operator" data-value="+">+</button>

        <button type="button" class="key-dark" data-action="digit" data-value="1">1</button>
        <button type="button" class="key-dark" data-action="digit" data-value="2">2</button>
        <button type="button" class="key-dark" data-action="digit" data-value="3">3</button>
        <button type="button" class="key-dark" data-action="constant" data-value="E">e</button>
        <button type="button" class="key-danger key-equals" data-action="equals">=</button>

        <button type="button" class="key-dark key-span-2" data-action="digit" data-value="0">0</button>
        <button type="button" class="key-dark" data-action="decimal">.</button>
        <button type="button" class="key-danger" data-action="clear">AC</button>
      </div>
    </div>
  `;

  function resetErrorIfNeeded() {
    if (state.display === "Error") {
      state.display = "0";
      state.expression = "";
      state.previousValue = null;
      state.operator = null;
      state.waiting = false;
    }
  }

  function applyUnary(action) {
    const current = Number(state.display);
    let result = current;
    let label = action;
    switch (action) {
      case "percent": result = current / 100; label = `${formatPrecise(current)} %`; break;
      case "sign": result = -current; label = `negate ${formatPrecise(current)}`; break;
      case "reciprocal": result = current === 0 ? NaN : 1 / current; label = `1 / ${formatPrecise(current)}`; break;
      case "square": result = current ** 2; label = `${formatPrecise(current)}^2`; break;
      case "sqrt": result = current < 0 ? NaN : Math.sqrt(current); label = `sqrt(${formatPrecise(current)})`; break;
      case "sin": result = Math.sin((current * Math.PI) / 180); label = `sin(${formatPrecise(current)})`; break;
      case "cos": result = Math.cos((current * Math.PI) / 180); label = `cos(${formatPrecise(current)})`; break;
      case "tan": result = Math.tan((current * Math.PI) / 180); label = `tan(${formatPrecise(current)})`; break;
      case "log": result = current <= 0 ? NaN : Math.log10(current); label = `log(${formatPrecise(current)})`; break;
      case "ln": result = current <= 0 ? NaN : Math.log(current); label = `ln(${formatPrecise(current)})`; break;
      case "factorial":
        if (current < 0 || !Number.isInteger(current) || current > 170) {
          result = NaN;
        } else {
          result = 1;
          for (let i = 2; i <= current; i += 1) result *= i;
        }
        label = `${formatPrecise(current)}!`;
        break;
      default:
        return;
    }
    if (!Number.isFinite(result)) {
      state.display = "Error";
      return;
    }
    state.display = formatPrecise(result);
    addCalcHistory(state, label, state.display);
    addActivity(calculator.short, state.display, label);
  }

  function evaluate() {
    if (!state.operator || state.previousValue === null) return;
    const current = Number(state.display);
    const result = calculateBinary(state.previousValue, current, state.operator);
    if (!Number.isFinite(result)) {
      state.display = "Error";
      return;
    }
    const expression = `${formatPrecise(state.previousValue)} ${state.operator} ${formatPrecise(current)}`;
    state.display = formatPrecise(result);
    state.expression = "";
    state.previousValue = null;
    state.operator = null;
    state.waiting = true;
    addCalcHistory(state, expression, state.display);
    addActivity(calculator.short, state.display, expression);
  }

  calcCard.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    const action = button.dataset.action;
    const value = button.dataset.value;
    resetErrorIfNeeded();

    if (action === "digit") {
      state.display = state.waiting || state.display === "0" ? value : state.display + value;
      state.waiting = false;
    } else if (action === "decimal") {
      if (state.waiting) {
        state.display = "0.";
        state.waiting = false;
      } else if (!state.display.includes(".")) {
        state.display += ".";
      }
    } else if (action === "clear") {
      state.display = "0";
      state.expression = "";
      state.previousValue = null;
      state.operator = null;
      state.waiting = false;
    } else if (action === "clear-entry") {
      state.display = "0";
      state.waiting = false;
    } else if (action === "backspace") {
      if (!state.waiting) state.display = state.display.length > 1 ? state.display.slice(0, -1) : "0";
    } else if (action === "operator") {
      const current = Number(state.display);
      if (state.operator && !state.waiting) {
        const interim = calculateBinary(state.previousValue, current, state.operator);
        state.previousValue = interim;
        state.display = formatPrecise(interim);
      } else {
        state.previousValue = current;
      }
      state.operator = value;
      state.expression = `${formatPrecise(state.previousValue)} ${value}`;
      state.waiting = true;
    } else if (action === "equals") {
      evaluate();
    } else if (action === "function") {
      applyUnary(value);
    } else if (action === "constant") {
      state.display = value === "PI" ? formatPrecise(Math.PI) : formatPrecise(Math.E);
      state.waiting = false;
    } else if (action === "memory") {
      const current = Number(state.display);
      if (value === "mc") state.memory = 0;
      if (value === "mr") state.display = formatPrecise(state.memory);
      if (value === "mplus") state.memory += current;
      if (value === "mminus") state.memory -= current;
    } else if (action === "clear-history") {
      state.history = [];
    }
    renderActiveCalculator();
  });

  const utilityPanel = createUtilityPanel(`
    <div class="calculator-badge">Workspace</div>
    <h3>${scientific ? "Advanced history" : "Calculation history"}</h3>
    <p class="subtle-copy">Tap a previous result to reuse it.</p>
    <div class="history-list">${renderCalcHistory(state)}</div>
  `);

  utilityPanel.querySelectorAll("[data-history-index]").forEach((button) => {
    button.addEventListener("click", () => {
      const item = state.history[Number(button.dataset.historyIndex)];
      state.display = item.result;
      state.waiting = false;
      state.expression = "";
      sharedState.activeUtilityTab = "workspace";
      renderActiveCalculator();
    });
  });

  wrapper.append(calcCard, utilityPanel);
  return wrapper;
}

function renderToolbar(calculator) {
  calculatorToolbar.innerHTML = `
    <div class="toolbar-chip"><strong>${calculator.category}</strong><span>${calculator.short}</span></div>
    <div class="toolbar-chip"><strong>${calculator.mode ? "Interactive calculator" : "Structured calculator"}</strong><span>${calculator.mode ? "Fast keypad workflow" : "Input-driven result view"}</span></div>
    <div class="toolbar-chip"><strong>${calculatorDefinitions.length} calculators</strong><span>${formatThemeName(sharedState.activeTheme)} theme active</span></div>
  `;
}

function renderActiveCalculator() {
  const calculator = getCalculatorById(sharedState.activeCalculatorId);
  activeTitle.textContent = calculator.title;
  activeDescription.textContent = calculator.description;
  renderToolbar(calculator);
  calculatorContent.innerHTML = "";
  calculatorContent.appendChild(calculator.mode ? renderPadCalculator(calculator) : renderFormCalculator(calculator));
}

calculatorSearch.addEventListener("input", (event) => {
  sharedState.searchQuery = event.target.value;
  renderNavigation();
});

themeSelect.addEventListener("change", (event) => {
  setTheme(event.target.value);
});

stageFullscreenButton.addEventListener("click", () => {
  toggleCalculatorFullscreen().catch(() => {
    stageFullscreenButton.textContent = "Fullscreen";
  });
});

mobileNavToggle.addEventListener("click", () => {
  navPanel.classList.toggle("open");
});

document.addEventListener("fullscreenchange", () => {
  updateFullscreenButton();
});

document.addEventListener("keydown", (event) => {
  const activeCalculator = getCalculatorById(sharedState.activeCalculatorId);
  if (!activeCalculator || !activeCalculator.mode) {
    return;
  }

  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement) {
    return;
  }

  const selectorMap = {
    Enter: '[data-action="equals"]',
    "=": '[data-action="equals"]',
    ".": '[data-action="decimal"]',
    Backspace: '[data-action="backspace"]',
    Escape: '[data-action="clear"]',
    "+": '[data-action="operator"][data-value="+"]',
    "-": '[data-action="operator"][data-value="-"]',
    "*": '[data-action="operator"][data-value="*"]',
    "/": '[data-action="operator"][data-value="/"]',
  };

  let selector = selectorMap[event.key];
  if (/^\d$/.test(event.key)) {
    selector = `[data-action="digit"][data-value="${event.key}"]`;
  }

  if (!selector) {
    return;
  }

  const button = calculatorContent.querySelector(selector);
  if (!button) {
    return;
  }

  event.preventDefault();
  button.click();
});

renderNavigation();
renderCategories();
renderActivity();
setTheme(sharedState.activeTheme);
updateFullscreenButton();
renderActiveCalculator();
