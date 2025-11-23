import { DocType } from './types';

export const MOCK_SCHEMA: DocType[] = [
  {
    name: "Sales Invoice",
    fields: [
      { fieldname: "name", label: "ID", fieldtype: "Data" },
      { fieldname: "customer_name", label: "Customer Name", fieldtype: "Data" },
      { fieldname: "grand_total", label: "Grand Total", fieldtype: "Currency" },
      { fieldname: "posting_date", label: "Posting Date", fieldtype: "Date" },
      { fieldname: "status", label: "Status", fieldtype: "Select" },
      { fieldname: "item_group", label: "Item Group", fieldtype: "Data" }
    ]
  },
  {
    name: "Customer",
    fields: [
      { fieldname: "customer_name", label: "Customer Name", fieldtype: "Data" },
      { fieldname: "customer_group", label: "Customer Group", fieldtype: "Link" },
      { fieldname: "territory", label: "Territory", fieldtype: "Link" },
      { fieldname: "loyalty_program", label: "Loyalty Program", fieldtype: "Link" }
    ]
  },
  {
    name: "Item",
    fields: [
      { fieldname: "item_code", label: "Item Code", fieldtype: "Data" },
      { fieldname: "item_name", label: "Item Name", fieldtype: "Data" },
      { fieldname: "stock_uom", label: "Stock UOM", fieldtype: "Link" },
      { fieldname: "standard_rate", label: "Standard Rate", fieldtype: "Currency" },
      { fieldname: "item_group", label: "Item Group", fieldtype: "Link" }
    ]
  },
  {
    name: "Employee",
    fields: [
      { fieldname: "employee_name", label: "Employee Name", fieldtype: "Data" },
      { fieldname: "department", label: "Department", fieldtype: "Link" },
      { fieldname: "date_of_joining", label: "Date of Joining", fieldtype: "Date" },
      { fieldname: "status", label: "Status", fieldtype: "Select" }
    ]
  }
];

export const SUGGESTED_QUESTIONS = [
  "Show me sales trends for the last 6 months",
  "Top 5 customers by revenue",
  "What is the distribution of sales by territory?",
  "Compare sales between Electronics and Furniture",
  "List employees who joined this year"
];
