function formatNumber(num) {
    return Number(num).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2});
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return `${String(d.getDate()).padStart(2, '0')}-${months[d.getMonth()]}-${d.getFullYear()}`;
}

// --- PRINT SPAN UPDATES ---
function updatePrintFields() {
    // Bill Details
    const billNo = document.getElementById('billNo');
    const billDate = document.getElementById('billDate');
    const billStartDate = document.getElementById('billStartDate');
    const billEndDate = document.getElementById('billEndDate');
    const hsnCode = document.getElementById('hsnCode');
    const dueDate = document.getElementById('dueDate');
    const latePenalty = document.getElementById('latePenalty');

    if (billNo) document.getElementById('billNoPrint').textContent = billNo.value;
    if (billDate) document.getElementById('billDatePrint').textContent = formatDate(billDate.value);
    if (billStartDate) document.getElementById('billStartDatePrint').textContent = formatDate(billStartDate.value);
    if (billEndDate) document.getElementById('billEndDatePrint').textContent = formatDate(billEndDate.value);
    if (hsnCode) document.getElementById('hsnCodePrint').textContent = hsnCode.value;
    if (dueDate) document.getElementById('dueDatePrint').textContent = formatDate(dueDate.value);
    if (latePenalty) document.getElementById('latePenaltyPrint').textContent = latePenalty.value;
}

// Attach listeners for print fields
window.addEventListener('DOMContentLoaded', function() {
    updatePrintFields();
    ['billNo','billDate','billStartDate','billEndDate','hsnCode','dueDate','latePenalty'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', updatePrintFields);
            el.addEventListener('change', updatePrintFields);
        }
    });
});

// --- BILLING LOGIC (your original code, unchanged except for .value/.textContent fixes) ---

function updateTableAmounts() {
    // For each row: Amount = Units * Tariff
    const rows = [
        { units: 'genUnits', tariff: 'genTariff', amount: 'genAmount' },
        { units: 'adjUnits', tariff: 'adjTariff', amount: 'adjAmount' },
        { units: 'deemedUnits', tariff: 'deemedTariff', amount: 'deemedAmount' }
    ];
    rows.forEach(row => {
        const unitsEl = document.getElementById(row.units);
        const units = parseFloat(unitsEl.value) || 0;
        const tariff = parseFloat(document.getElementById(row.tariff).value) || 0;
        const amount = units * tariff;
        document.getElementById(row.amount).textContent = formatNumber(amount);
    });
}

function getTotalCharges() {
    // Get values from table inputs
    const genAmount = parseFloat(document.getElementById('genAmount').value) || 0;
    const adjAmount = parseFloat(document.getElementById('adjAmount').value) || 0;
    const deemedAmount = parseFloat(document.getElementById('deemedAmount').value) || 0;
    // Solar Charges = sum of all amounts
    const solarCharges = genAmount + adjAmount + deemedAmount;
    // Electricity Duty and GST are 0 for now
    const electricityDuty = 0;
    const gst = 0;
    // Total Charges = Solar Charges + Duty + GST
    const totalCharges = solarCharges + electricityDuty + gst;
    return {
        solarCharges,
        electricityDuty,
        gst,
        totalCharges
    };
}

function updateBillSummary() {
    // Get values from table inputs
    const genAmount = parseFloat(document.getElementById('genAmount').textContent?.replace(/,/g, '') || document.getElementById('genAmount').value || 0) || 0;
    const adjAmount = parseFloat(document.getElementById('adjAmount').textContent?.replace(/,/g, '') || document.getElementById('adjAmount').value || 0) || 0;
    const deemedAmount = parseFloat(document.getElementById('deemedAmount').textContent?.replace(/,/g, '') || document.getElementById('deemedAmount').value || 0) || 0;
    // Solar Charges = sum of all amounts
    const solarCharges = genAmount + adjAmount + deemedAmount;
    // Electricity Duty and GST are 0 for now
    const electricityDuty = 0;
    const gst = 0;
    // Total Charges = Solar Charges + Duty + GST
    const totalCharges = solarCharges + electricityDuty + gst;
    // Update DOM
    document.getElementById('solarCharges').textContent = formatNumber(solarCharges);
    document.getElementById('electricityDuty').textContent = formatNumber(electricityDuty);
    document.getElementById('gst').textContent = formatNumber(gst);
    document.getElementById('totalCharges').textContent = formatNumber(totalCharges);
    updateCurrentBillAmountFromTotalCharges();
}

function getLatePenaltyCharges() {
    // Get penalty rate from input (e.g., '2% / Month')
    const penaltyInput = document.getElementById('latePenalty').value;
    const dueDate = document.getElementById('dueDate').value;
    const today = new Date();
    let penaltyRate = 0;
    let penaltyAmount = 0;
    // Extract numeric value from penalty input
    const match = penaltyInput.match(/([\d.]+)\s*%/);
    if (match) {
        penaltyRate = parseFloat(match[1]);
    }
    // Calculate days overdue
    let daysOverdue = 0;
    if (dueDate) {
        const due = new Date(dueDate);
        daysOverdue = Math.max(0, Math.floor((today - due) / (1000 * 60 * 60 * 24)));
    }
    // Only apply penalty if overdue
    if (penaltyRate > 0 && daysOverdue > 0) {
        // Penalty is per month, so prorate for days overdue
        const { totalCharges } = getTotalCharges();
        penaltyAmount = totalCharges * (penaltyRate / 100) * (daysOverdue / 30);
    }
    return penaltyAmount;
}

function updateRightAmounts() {
    // Get current bill amount from left portion
    const totalCharges = document.getElementById('totalCharges').textContent.replace(/,/g, '');
    // Remove decimals for invoice amount
    const invoiceAmount = Math.round(Number(totalCharges));
    document.getElementById('currentInvoiceAmount').textContent = 'Rs ' + formatNumber(invoiceAmount).replace('.00','');
    document.getElementById('currentBillAmount').textContent = 'Rs ' + formatNumber(Number(totalCharges));
    // Late Penalty Charges
    const penaltyAmount = getLatePenaltyCharges();
    document.getElementById('latePenaltyCharges').textContent = 'Rs ' + formatNumber(penaltyAmount);
}

function updateAll() {
    updateTableAmounts();
    updateBillSummary();
    updateRightAmounts();
    updatePrintFields();
}

// Add event listeners for all relevant fields
['genUnits','genTariff','adjUnits','adjTariff','deemedUnits','deemedTariff','latePenalty','dueDate'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
        el.addEventListener('input', updateAll);
        el.addEventListener('change', updateAll);
    }
});

// Also update on page load
updateAll();

// Existing listeners for address and name (optional, for logging)
['companyName','billTo','shipTo','billNo','billDate','billStartDate','billEndDate','hsnCode'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
        el.addEventListener('input', function() {
            console.log(id + ':', this.value);
        });
    }
});

// --- METER READINGS DYNAMIC TABLE ---
function updateSummaryFromMeter(totalUnits) {
    document.getElementById('billedUnits').textContent = totalUnits.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    const days = parseInt(document.getElementById('days').textContent) || 1;
    const plantCapacity = parseFloat(document.getElementById('plantCapacity').value) || 0;
    const kwhPerDay = totalUnits / days;
    document.getElementById('kwhPerDay').textContent = kwhPerDay.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    const kwhPerKwpDay = plantCapacity ? (kwhPerDay / plantCapacity) : 0;
    document.getElementById('kwhPerKwpDay').textContent = kwhPerKwpDay.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    const genUnitsInput = document.getElementById('genUnits');
    if (genUnitsInput) {
        genUnitsInput.value = totalUnits.toFixed(2);
    }
    const genTariff = parseFloat(document.getElementById('genTariff').value) || 0;
    const genAmount = totalUnits * genTariff;
    document.getElementById('genAmount').textContent = formatNumber(genAmount);
}

function updateMeterTable() {
    const rows = document.querySelectorAll('#meterTableBody tr');
    let total = 0;
    rows.forEach(row => {
        const start = parseFloat(row.querySelector('.meter-start').value) || 0;
        const end = parseFloat(row.querySelector('.meter-end').value) || 0;
        const mf = parseFloat(row.querySelector('.meter-mf').value) || 1;
        const adj = parseFloat(row.querySelector('.meter-adj').value) || 0;
        const diff = end - start;
        const totalUnits = (diff * mf) + adj;
        row.querySelector('.meter-diff').value = diff.toFixed(4);
        row.querySelector('.meter-total').value = totalUnits.toFixed(2);
        total += totalUnits;
    });
    document.getElementById('meterTotalUnits').textContent = total.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    updateSummaryFromMeter(total);
    updateBillAmountsFromInputs();
    updateBillSummary();
}

function addMeterRow() {
    const tbody = document.getElementById('meterTableBody');
    const row = document.createElement('tr');
    row.innerHTML = `
        <td><input type="text" class="meter-input" value="Device-${tbody.children.length + 1}"></td>
        <td><input type="number" class="meter-input meter-start" value="0" step="0.0001"></td>
        <td><input type="number" class="meter-input meter-end" value="0" step="0.0001"></td>
        <td><input type="number" class="meter-input meter-diff" value="0" step="0.0001" readonly></td>
        <td><input type="number" class="meter-input meter-mf" value="1.00" step="0.01"></td>
        <td><input type="number" class="meter-input meter-adj" value="0.00" step="0.01"></td>
        <td><input type="number" class="meter-input meter-total" value="0.00" step="0.01" readonly></td>
    `;
    tbody.appendChild(row);
    attachMeterRowListeners(row);
    updateMeterTable();
}

function attachMeterRowListeners(row) {
    row.querySelectorAll('.meter-start, .meter-end, .meter-mf, .meter-adj').forEach(input => {
        input.addEventListener('input', updateMeterTable);
    });
}

document.querySelectorAll('#meterTableBody tr').forEach(attachMeterRowListeners);
document.getElementById('addDeviceBtn').addEventListener('click', addMeterRow);
document.getElementById('removeDeviceBtn').addEventListener('click', function() {
    const tbody = document.getElementById('meterTableBody');
    if (tbody.children.length > 1) {
        tbody.removeChild(tbody.lastElementChild);
        updateMeterTable();
    }
});

// Add event listener to re-calculate summary when capacity changes
const plantCapacityInput = document.getElementById('plantCapacity');
if (plantCapacityInput) {
    plantCapacityInput.addEventListener('input', updateMeterTable);
}

updateMeterTable();
// --- END METER READINGS DYNAMIC TABLE ---

function updateBillAmountsFromInputs() {
    const adjUnits = parseFloat(document.getElementById('adjUnits').value) || 0;
    const adjTariff = parseFloat(document.getElementById('adjTariff').value) || 0;
    const adjAmount = adjUnits * adjTariff;
    document.getElementById('adjAmount').textContent = formatNumber(adjAmount);

    const deemedUnits = parseFloat(document.getElementById('deemedUnits').value) || 0;
    const deemedTariff = parseFloat(document.getElementById('deemedTariff').value) || 0;
    const deemedAmount = deemedUnits * deemedTariff;
    document.getElementById('deemedAmount').textContent = formatNumber(deemedAmount);
}

['adjUnits','adjTariff','deemedUnits','deemedTariff'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
        el.addEventListener('input', function() {
            updateBillAmountsFromInputs();
            updateBillSummary();
        });
    }
});
updateBillAmountsFromInputs();
updateBillSummary();

function updateCurrentBillAmountFromTotalCharges() {
    const totalCharges = document.getElementById('totalCharges').textContent;
    document.getElementById('currentBillAmount').textContent = 'Rs ' + totalCharges;
    updateCurrentInvoiceAmount();
}

function updateCurrentInvoiceAmount() {
    const totalCharges = parseFloat((document.getElementById('totalCharges').textContent || '0').replace(/,/g, ''));
    const latePenaltyText = document.getElementById('latePenaltyCharges').textContent.replace('Rs', '').replace(/,/g, '').trim();
    const latePenalty = parseFloat(latePenaltyText) || 0;
    const invoiceAmount = totalCharges + latePenalty;
    document.getElementById('currentInvoiceAmount').textContent = 'Rs ' + invoiceAmount.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2});
}

const latePenaltyChargesEl = document.getElementById('latePenaltyCharges');
if (latePenaltyChargesEl) {
    const observer = new MutationObserver(updateCurrentInvoiceAmount);
    observer.observe(latePenaltyChargesEl, { childList: true });
}
updateCurrentInvoiceAmount();

// --- Auto-formatting for input fields ---
function formatInputField(input) {
    if (!input) return;
    const value = parseFloat(input.value);

    // Use different precision for tariffs vs units
    const isTariff = input.id.toLowerCase().includes('tariff');
    const precision = isTariff ? 3 : 2;
    const defaultValue = (0).toFixed(precision);

    if (isNaN(value)) {
        input.value = defaultValue;
        return;
    }
    input.value = value.toFixed(precision);
}

const idsToFormat = ['genUnits', 'genTariff', 'adjUnits', 'adjTariff', 'deemedUnits', 'deemedTariff'];
idsToFormat.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
        // Format on blur
        el.addEventListener('blur', () => formatInputField(el));
        // Format on initial load to ensure consistency
        formatInputField(el);
    }
});

// Print functionality for Generate Bill button
const generateBtn = document.getElementById('generateBillBtn');
if (generateBtn) {
    generateBtn.addEventListener('click', function() {
        document.body.classList.add('print-bill');
        window.print();
        setTimeout(() => document.body.classList.remove('print-bill'), 1000);
    });
}