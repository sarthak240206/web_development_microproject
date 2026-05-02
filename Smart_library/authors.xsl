<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:template match="/">
    <html>
      <head>
        <title>BookVerse Authors Table</title>
        <style>
          body {
            font-family: "Segoe UI", Arial, sans-serif;
            background: #f5f7ff;
            color: #1d2440;
            padding: 16px;
          }
          h2 {
            margin-bottom: 8px;
          }
          .meta {
            color: #5f6888;
            margin-bottom: 12px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            border-radius: 10px;
            overflow: hidden;
            background: #fff;
            box-shadow: 0 10px 24px rgba(36, 48, 126, 0.14);
          }
          th, td {
            border: 1px solid #dce3ff;
            padding: 10px;
            text-align: left;
          }
          th {
            background: linear-gradient(120deg, #4857e8, #7a42f4);
            color: white;
          }
          tr:nth-child(even) {
            background: #f7f8ff;
          }
        </style>
      </head>
      <body>
        <h2>Famous Authors</h2>
        <p class="meta">Rendered using XML + XSLT | Total Authors: <xsl:value-of select="count(authors/author)"/></p>
        <table>
          <tr>
            <th>Name</th>
            <th>Country</th>
            <th>Genre</th>
            <th>Popular Book</th>
          </tr>
          <xsl:for-each select="authors/author">
            <tr>
              <td><xsl:value-of select="name"/></td>
              <td><xsl:value-of select="country"/></td>
              <td><xsl:value-of select="genre"/></td>
              <td><xsl:value-of select="popular_book"/></td>
            </tr>
          </xsl:for-each>
        </table>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
