using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Hrms.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddProductionLineToShiftAssignment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ProductionLineId",
                table: "ShiftAssignments",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ShiftAssignments_ProductionLineId",
                table: "ShiftAssignments",
                column: "ProductionLineId");

            migrationBuilder.AddForeignKey(
                name: "FK_ShiftAssignments_ProductionLines_ProductionLineId",
                table: "ShiftAssignments",
                column: "ProductionLineId",
                principalTable: "ProductionLines",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ShiftAssignments_ProductionLines_ProductionLineId",
                table: "ShiftAssignments");

            migrationBuilder.DropIndex(
                name: "IX_ShiftAssignments_ProductionLineId",
                table: "ShiftAssignments");

            migrationBuilder.DropColumn(
                name: "ProductionLineId",
                table: "ShiftAssignments");
        }
    }
}
