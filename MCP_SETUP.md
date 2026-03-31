# MCP Server Setup Guide

## MCP Servers Configured

This project now has both **Playwright MCP** and **Figma MCP** servers configured.

### MCP Configuration File
📄 `mcp_config.json` - Contains server configurations for:
- **Playwright MCP** - Browser automation and testing
- **Figma MCP** - Design system integration

## Setup Instructions

### 1. Playwright MCP (Ready to Use)
The Playwright MCP server is configured and ready. It will be automatically installed when first used via npx.

**Features:**
- Browser automation
- Accessibility tree snapshots
- Form interactions
- Screenshot capture
- Navigation testing

### 2. Figma MCP (Requires API Key)

To use the Figma MCP server, you need to add your Figma API key to the configuration.

#### Get Your Figma API Key:

1. **Log into Figma**
   - Go to https://www.figma.com and sign in

2. **Access Settings**
   - Click your profile picture (top-right)
   - Select **Settings**

3. **Generate Token**
   - Scroll to **Personal Access Tokens**
   - Click **Create new token**
   - Give it a name (e.g., "MCP Integration")
   - Copy the generated token

4. **Update Configuration**
   - Open `mcp_config.json` in your project
   - Replace `YOUR_FIGMA_API_KEY_HERE` with your actual token:
   ```json
   "env": {
     "FIGMA_API_KEY": "your-actual-token-here"
   }
   ```

## Using MCP Servers in Windsurf

### Enable MCP Servers:
1. Open Windsurf settings
2. Navigate to MCP/Extensions section
3. Enable MCP servers
4. Point to your `mcp_config.json` file

### Available Tools:

**Playwright MCP:**
- `browser_navigate` - Navigate to URLs
- `browser_click` - Click elements
- `browser_type` - Type text
- `browser_select` - Select options
- `browser_take_screenshot` - Capture screenshots
- `browser_get_accessibility_tree` - Get page structure

**Figma MCP:**
- `get_file` - Get Figma file data
- `get_file_nodes` - Get specific nodes
- `get_images` - Export images
- `get_comments` - Get file comments

## Integration Workflow

Use both MCP servers together for:
1. **Design-to-Code**: Extract designs from Figma
2. **Visual Testing**: Compare implementations against designs
3. **Automated Testing**: Test UI using Playwright
4. **Documentation**: Generate screenshots from both tools

## Next Steps

1. ✅ Playwright MCP - Ready
2. ⏳ Figma MCP - Add your API key
3. 🔄 Restart Windsurf to load MCP servers
4. 🧪 Test connections with simple queries

## Troubleshooting

**Issue**: MCP servers not loading
- **Solution**: Restart Windsurf after configuration changes

**Issue**: Figma API errors
- **Solution**: Verify your API token is valid and has file access permissions

**Issue**: Playwright not responding
- **Solution**: Ensure Node.js 18+ is installed and npx is available

## Resources

- [Playwright MCP Documentation](https://github.com/microsoft/playwright-mcp)
- [Figma API Documentation](https://www.figma.com/developers/api)
- [MCP Protocol Specification](https://modelcontextprotocol.io/)
