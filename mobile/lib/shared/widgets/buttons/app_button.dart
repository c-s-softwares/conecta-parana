import 'package:flutter/material.dart';

enum AppButtonVariant {
  primary,    
  secondary,   
  ghost,      
  destructive, 
}

class AppButton extends StatelessWidget {

  final String label;             
  final VoidCallback? onPressed;  
  final bool isLoading;           
  final AppButtonVariant variant; 

  const AppButton({
    super.key,                                       
    required this.label,                     
    this.onPressed,                                  
    this.isLoading = false,                       
    this.variant = AppButtonVariant.primary,        
  });

  @override
  Widget build(BuildContext context) {

    final colorScheme = Theme.of(context).colorScheme;

    return Semantics(
      label: label,
      button: true,

      child: SizedBox(
        width: double.infinity,
        height: 48,            

      
        child: switch (variant) {

          AppButtonVariant.primary => ElevatedButton(
              onPressed: isLoading ? null : onPressed, 
              style: ElevatedButton.styleFrom(
                backgroundColor: colorScheme.primary,   
                foregroundColor: colorScheme.onPrimary, 
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8), 
                ),
              ),
              child: _buildContent(), 
            ),

          AppButtonVariant.secondary => OutlinedButton(
              onPressed: isLoading ? null : onPressed,
              style: OutlinedButton.styleFrom(
                side: BorderSide(color: colorScheme.primary),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              child: _buildContent(),
            ),

          AppButtonVariant.ghost => TextButton(
              onPressed: isLoading ? null : onPressed,
              child: _buildContent(),
            ),

          AppButtonVariant.destructive => ElevatedButton(
              onPressed: isLoading ? null : onPressed,
              style: ElevatedButton.styleFrom(
                backgroundColor: colorScheme.error,  
                foregroundColor: colorScheme.onError, 
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              child: _buildContent(),
            ),
        },
      ),
    );
  }

  Widget _buildContent() {
    if (isLoading) {
      return const SizedBox(
        height: 20,
        width: 20,
        child: CircularProgressIndicator(
          strokeWidth: 2,
          color: Colors.white, 
        ),
      );
    }
    return Text(label);
  }
}