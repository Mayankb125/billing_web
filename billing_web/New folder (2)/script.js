function formatNumber(num) {
    return Number(num).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
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
window.addEventListener('DOMContentLoaded', function () {
    updatePrintFields();
    ['billNo', 'billDate', 'billStartDate', 'billEndDate', 'hsnCode', 'dueDate', 'latePenalty'].forEach(id => {
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
    // Add custom rows
    let customTotal = 0;
    document.querySelectorAll('.custom-bill-row').forEach(row => {
        const amountSpan = row.querySelector('.custom-amount');
        if (amountSpan) {
            customTotal += parseFloat(amountSpan.textContent.replace(/,/g, '') || 0);
        }
    });
    // Solar Charges = sum of all amounts
    const solarCharges = genAmount + adjAmount + deemedAmount + customTotal;
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
    document.getElementById('currentInvoiceAmount').textContent = 'Rs ' + formatNumber(invoiceAmount).replace('.00', '');
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
['genUnits', 'genTariff', 'adjUnits', 'adjTariff', 'deemedUnits', 'deemedTariff', 'latePenalty', 'dueDate'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
        el.addEventListener('input', updateAll);
        el.addEventListener('change', updateAll);
    }
});

// Also update on page load
updateAll();

// Existing listeners for address and name (optional, for logging)
['companyName', 'billTo', 'shipTo', 'billNo', 'billDate', 'billStartDate', 'billEndDate', 'hsnCode'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
        el.addEventListener('input', function () {
            console.log(id + ':', this.value);
        });
    }
});

// --- METER READINGS DYNAMIC TABLE ---
function updateSummaryFromMeter(totalUnits) {
    document.getElementById('billedUnits').textContent = totalUnits.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const days = parseInt(document.getElementById('days').textContent) || 1;
    const plantCapacity = parseFloat(document.getElementById('plantCapacity').value) || 0;
    const kwhPerDay = totalUnits / days;
    document.getElementById('kwhPerDay').textContent = kwhPerDay.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const kwhPerKwpDay = plantCapacity ? (kwhPerDay / plantCapacity) : 0;
    document.getElementById('kwhPerKwpDay').textContent = kwhPerKwpDay.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
    document.getElementById('meterTotalUnits').textContent = total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
document.getElementById('removeDeviceBtn').addEventListener('click', function () {
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

['adjUnits', 'adjTariff', 'deemedUnits', 'deemedTariff'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
        el.addEventListener('input', function () {
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
    document.getElementById('currentInvoiceAmount').textContent = 'Rs ' + invoiceAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
    generateBtn.addEventListener('click', function () {
        document.body.classList.add('print-bill');
        window.print();
        setTimeout(() => document.body.classList.remove('print-bill'), 1000);
    });
}

// --- Add custom row to bill table and allow removing any row, but keep at least one row ---
function attachRemoveRowListeners() {
    const billTableBody = document.getElementById('billTableBody');
    billTableBody.querySelectorAll('.remove-row-btn').forEach(btn => {
        btn.onclick = function () {
            const rows = billTableBody.querySelectorAll('tr');
            if (rows.length > 1) {
                btn.closest('tr').remove();
                updateAll();
            } else {
                alert('At least one row must remain in the table.');
            }
        };
    });
}

// --- PDF UPLOAD AND PARSING ---

const uploadBtn = document.getElementById('uploadBillBtn');
const pdfUploadInput = document.getElementById('pdfUpload');

if (uploadBtn && pdfUploadInput) {
    uploadBtn.addEventListener('click', () => {
        pdfUploadInput.click();
    });

    pdfUploadInput.addEventListener('change', handlePdfUpload);
}

async function handlePdfUpload(event) {
    console.log('PDF upload triggered');
    const file = event.target.files[0];
    if (!file || file.type !== 'application/pdf') {
        alert('Please select a PDF file.');
        return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
        const pdfData = new Uint8Array(e.target.result);
        try {
            console.log('Reading PDF...');
            const text = await getPdfText(pdfData);
            console.log('PDF text:', text.slice(0, 500)); // Log first 500 chars
            const parsedData = parsePdfText(text);
            console.log('Parsed PDF data:', parsedData);
            autofillForm(parsedData);
            alert('Bill data imported successfully!');
        } catch (error) {
            console.error('Error parsing PDF:', error);
            alert('Failed to parse the PDF bill. Please ensure it is a valid bill generated by this system.');
        }
    };
    reader.readAsArrayBuffer(file);
    event.target.value = ''; // Reset file input
}

async function getPdfText(data) {
    const pdf = await pdfjsLib.getDocument({ data }).promise;
    let textContent = '';
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        
        // Sort items by their vertical position, then horizontal, to reconstruct lines.
        const items = content.items.slice().sort((a, b) => {
            if (a.transform[5] > b.transform[5]) return -1; // Y position
            if (a.transform[5] < b.transform[5]) return 1;
            if (a.transform[4] < b.transform[4]) return -1; // X position
            if (a.transform[4] > b.transform[4]) return 1;
            return 0;
        });

        let lastY = -1;
        items.forEach(item => {
            // If the Y position has changed significantly, insert a newline.
            if (lastY !== -1 && Math.abs(item.transform[5] - lastY) > 5) {
                textContent += '\n';
            }
            textContent += item.str + ' ';
            lastY = item.transform[5];
        });
        textContent += '\n\n';
    }
    return textContent;
}

function parsePdfText(text) {
    console.log('PDF TEXT FOR DEBUGGING:', text); // Keep for debugging new PDFs
    const data = {};

    const getValue = (sourceText, regex) => {
        if (!sourceText) return null;
        const match = sourceText.match(regex);
        return match ? match[1].trim() : null;
    };

    // --- Customer and Address Info (now in a simple block) ---
    data.companyName = getValue(text, /M\/s\.(.*?)\s*Offtaker code/s);
    data.offtakerCode = getValue(text, /Offtaker code\s*-\s*(.*?)\s*Bill To:/s);
    data.billTo = getValue(text, /Bill To:\s*([\s\S]*?)\s*GSTIN:/s);
    
    // GSTIN can appear multiple times. We'll grab the first for billTo and second for shipTo.
    const gstinMatches = text.matchAll(/GSTIN:\s*([A-Z0-9]+)/gs);
    const gstinArray = Array.from(gstinMatches, m => m[1]);
    if (gstinArray.length > 0) data.gstin = gstinArray[0];

    data.shipTo = getValue(text, /Ship To:\s*([\s\S]*?)\s*GSTIN:\s*([A-Z0-9]+)/s);
    data.plantCapacity = getValue(text, /Solar Plant Total Capacity \(kW\):\s*([\d.]+)/s);
    
    // --- Bill Details (Right Panel) ---
    data.billNo = getValue(text, /Bill No:\s*([^\n]*)/s);
    data.billDate = getValue(text, /Bill Date:\s*([^\n]*)/s);
    data.billStartDate = getValue(text, /Bill Start Date:\s*([^\n]*)/s);
    data.billEndDate = getValue(text, /Bill End Date:\s*([^\n]*)/s);
    data.hsnCode = getValue(text, /HSN Code:\s*([^\n]*)/s);
    data.dueDate = getValue(text, /Due Date:\s*([^\n]*)/s);
    data.latePenalty = getValue(text, /Late Payment Penalty:\s*(.*?)\s*Current/s);

    // --- Bill Breakup Table (Corrected Parsing for linear text) ---
    const billBreakupText = getValue(text, /BREAKUP OF CURRENT BILL([\s\S]*?)Solar Charges/s);
    if (billBreakupText) {
        const genMatch = billBreakupText.match(/Generation\s+([\d,.-]+)\s+([\d,.-]+)/);
        if(genMatch) {
            data.genUnits = genMatch[1].replace(/,/g, '');
            data.genTariff = genMatch[2].replace(/,/g, '');
        }

        const adjMatch = billBreakupText.match(/Adjustment\(kWh\)\s+([\d,.-]+)\s+([\d,.-]+)/);
        if(adjMatch) {
            data.adjUnits = adjMatch[1].replace(/,/g, '');
            data.adjTariff = adjMatch[2].replace(/,/g, '');
        }
        
        const deemedMatch = billBreakupText.match(/Deemed\s+Generation\s+([\d,.-]+)\s+([\d,.-]+)/);
        if(deemedMatch) {
            data.deemedUnits = deemedMatch[1].replace(/,/g, '');
            data.deemedTariff = deemedMatch[2].replace(/,/g, '');
        }
    }

    // --- Other fields ---
    data.companyTitle = getValue(text, /^(.*?)\s*M\/s\./s);
    data.remarks = getValue(text, /Remarks:\s*(.*?)\s*For any queries/s);
    data.supplyMonth = getValue(text, /SOLAR BILL OF SUPPLY\s*-\s*([A-Za-z]+)/);
    data.supplyYear = getValue(text, /SOLAR BILL OF SUPPLY\s*-\s*[A-Za-z]+\s*(\d{4})/);

    // --- Meter Readings Table ---
    data.meterReadings = [];
    const meterSection = text.match(/METER READINGS([\s\S]*?)Total generation/);
    if (meterSection) {
        const rowRegex = /(Device-\d+)\s+([\d,.-]+)\s+([\d,.-]+)\s+[\d,.-]+\s+([\d,.-]+)\s+([\d,.-]+)/g;
        let match;
        while ((match = rowRegex.exec(meterSection[1])) !== null) {
            data.meterReadings.push({
                name: match[1],
                start: match[2].replace(/,/g, ''),
                end: match[3].replace(/,/g, ''),
                mf: match[4].replace(/,/g, ''),
                adj: match[5].replace(/,/g, '')
            });
        }
    }

    console.log('parsePdfText FINAL result:', data);
    return data;
}

function autofillForm(data) {
    console.log('autofillForm called with:', data);
    if (!data) return;

    const setVal = (id, value) => {
        const el = document.getElementById(id);
        if (!el) {
            console.warn('Element not found for id:', id);
            return;
        }
        if (value !== null && value !== undefined) {
            // Handle both input/textarea and other elements like span
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.value = value;
            } else {
                el.textContent = value;
            }
            console.log('Set', id, 'to', value);
        }
    };

    const parseDateForInput = (dateStr) => {
        if (!dateStr) return '';
        const parts = dateStr.match(/(\d{2})-(\w{3})-(\d{4})/);
        if (!parts) return '';
        const day = parts[1];
        const monthStr = parts[2];
        const year = parts[3];
        const month = new Date(Date.parse(monthStr + " 1, 2012")).getMonth() + 1;
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    };


    // --- Company and Bill Details ---
    setVal('companyTitle', data.companyTitle);
    setVal('companyName', data.companyName);
    setVal('offtakerCode', data.offtakerCode);
    setVal('billTo', data.billTo);
    setVal('shipTo', data.shipTo);
    setVal('gstin', data.gstin);
    setVal('plantCapacity', data.plantCapacity);

    setVal('billNo', data.billNo);
    setVal('billDate', parseDateForInput(data.billDate));
    setVal('billStartDate', parseDateForInput(data.billStartDate));
    setVal('billEndDate', parseDateForInput(data.billEndDate));
    setVal('hsnCode', data.hsnCode);
    setVal('dueDate', parseDateForInput(data.dueDate));
    setVal('latePenalty', data.latePenalty);

    // --- Bill Table ---
    setVal('genUnits', data.genUnits?.replace(/,/g, ''));
    setVal('genTariff', data.genTariff?.replace(/,/g, ''));
    setVal('adjUnits', data.adjUnits?.replace(/,/g, ''));
    setVal('adjTariff', data.adjTariff?.replace(/,/g, ''));
    setVal('deemedUnits', data.deemedUnits?.replace(/,/g, ''));
    setVal('deemedTariff', data.deemedTariff?.replace(/,/g, ''));

    setVal('remarks', data.remarks);

    // --- Payment Details ---
    setVal('bankNameInput', data.bankNameInput);
    setVal('acNoInput', data.acNoInput);
    setVal('ifscInput', data.ifscInput);

    // --- Supply Month/Year ---
    setVal('supplyMonth', data.supplyMonth);
    setVal('supplyYear', data.supplyYear);

    // --- Meter Readings Table ---
    if (data.meterReadings && data.meterReadings.length > 0) {
        const tbody = document.getElementById('meterTableBody');
        tbody.innerHTML = '';
        data.meterReadings.forEach(reading => {
            addMeterRow(); // This function adds a new row to the table.
            const newRow = tbody.lastElementChild;
            // Set all meter fields if present
            const meterName = newRow.querySelector('input[type="text"].meter-input') || newRow.querySelector('.meter-name');
            if (meterName) meterName.value = reading.name;
            if (newRow.querySelector('.meter-start')) newRow.querySelector('.meter-start').value = reading.start;
            if (newRow.querySelector('.meter-end')) newRow.querySelector('.meter-end').value = reading.end;
            if (newRow.querySelector('.meter-mf')) newRow.querySelector('.meter-mf').value = reading.mf;
            if (newRow.querySelector('.meter-adj')) newRow.querySelector('.meter-adj').value = reading.adj;
        });
    }

    updateAll();
    updateMeterTable();
}

document.addEventListener('DOMContentLoaded', function () {
    const addRowBtn = document.getElementById('addRowBtn');
    const billTableBody = document.getElementById('billTableBody');
    attachRemoveRowListeners();
    if (addRowBtn && billTableBody) {
        addRowBtn.addEventListener('click', function () {
            const tr = document.createElement('tr');
            tr.className = 'custom-bill-row';
            tr.innerHTML = `
                <td><input type="text" class="table-input custom-name" placeholder="Insert Name"></td>
                <td><input type="number" class="table-input custom-units" value="0.00" step="0.01" placeholder="Insert Value"></td>
                <td><input type="number" class="table-input custom-tariff" value="0.00" step="0.01" placeholder="Insert Value"></td>
                <td><span class="custom-amount">0.00</span></td>
                <td><button type="button" class="remove-row-btn" title="Remove Row">×</button></td>
            `;
            billTableBody.appendChild(tr);
            attachRemoveRowListeners();
            // Amount calculation logic
            const unitsInput = tr.querySelector('.custom-units');
            const tariffInput = tr.querySelector('.custom-tariff');
            const amountSpan = tr.querySelector('.custom-amount');
            function updateAmountAndAll() {
                const units = parseFloat(unitsInput.value) || 0;
                const tariff = parseFloat(tariffInput.value) || 0;
                const amount = units * tariff;
                amountSpan.textContent = amount.toFixed(2);
                updateAll();
            }
            unitsInput.addEventListener('input', updateAmountAndAll);
            tariffInput.addEventListener('input', updateAmountAndAll);
        });
    }
});

document.addEventListener('DOMContentLoaded', function () {
    const addRowBtn = document.getElementById('addRowBtn');
    const billTableBody = document.getElementById('billTableBody');
    attachRemoveRowListeners();
    if (addRowBtn && billTableBody) {
        addRowBtn.addEventListener('click', function () {
            const tr = document.createElement('tr');
            tr.className = 'custom-bill-row';
            tr.innerHTML = `
                <td><input type="text" class="table-input custom-name" placeholder="Insert Name"></td>
                <td><input type="number" class="table-input custom-units" value="0.00" step="0.01" placeholder="Insert Value"></td>
                <td><input type="number" class="table-input custom-tariff" value="0.00" step="0.01" placeholder="Insert Value"></td>
                <td><span class="custom-amount">0.00</span></td>
                <td><button type="button" class="remove-row-btn" title="Remove Row">×</button></td>
            `;
            billTableBody.appendChild(tr);
            attachRemoveRowListeners();
            // Amount calculation logic
            const unitsInput = tr.querySelector('.custom-units');
            const tariffInput = tr.querySelector('.custom-tariff');
            const amountSpan = tr.querySelector('.custom-amount');
            function updateAmountAndAll() {
                const units = parseFloat(unitsInput.value) || 0;
                const tariff = parseFloat(tariffInput.value) || 0;
                const amount = units * tariff;
                amountSpan.textContent = amount.toFixed(2);
                updateAll();
            }
            unitsInput.addEventListener('input', updateAmountAndAll);
            tariffInput.addEventListener('input', updateAmountAndAll);
        });
    }
});