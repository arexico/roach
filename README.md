# 🪳 Roach - Route Origin Authorization Checker

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)](https://reactjs.org/)

A modern CLI tool with an interactive terminal interface for exploring **RPKI**, **IRR**, and **BGP** data. Built with TypeScript, React (Ink), and powered by the IRRExplorer API.

## ✨ Features

- **Interactive TUI Mode** - Beautiful terminal interface for route authorization exploration
- **Batch Processing** - Process multiple prefixes/ASNs and export to CSV
- **RPKI Validation** - RPKI status checking
- **BGP Origin Information** - Current routing table announcements

## 🚀 Quick Start

### Installation

```bash
npm install -g @arexico/roach
```

### Interactive Mode

```bash
roach
```

**Supported input formats:**
- **ASN**: `AS13335`, `199036`
- **IPv4**: `1.1.1.1`, `1.1.1.0/24`
- **IPv6**: `2001:db8::1`, `2001:db8::/32`

**Navigation:**
- Use arrow keys to browse results
- Press `q` or `Esc` to return to input

### Batch Processing

```bash
roach batch input.txt output.csv
```

**Input file example:**
```
1.1.1.0/24
8.8.8.8
2001:4860:4860::8888
```

**CSV output:**
```csv
subnet,origin,rpki
"1.1.1.0/24",AS13335,valid
"8.8.8.0/24",AS15169,valid
"2001:4860::/32",AS15169,valid
```

## 📊 Data Sources & Credits

This tool is powered by the **[IRRExplorer API](https://irrexplorer.nlnog.net/)** provided by Stichting NLNOG. IRRExplorer is a free and invaluable service that aggregates IRR, RPKI and BGP data from multiple sources.

> 💡 **Note**: IRRExplorer is a free public service. Please use Roach in accordance with the usage guidelines of IRRexplorer (e.g. not use it in automated scenarios). While we do love IRRExplorer, we are not affiliated with the Stichting NLNOG.

---

**Made with ❤️ by the Arexico team**

*Roach helps network operators validate announcements and explore RPKI/IRR data with ease.*
